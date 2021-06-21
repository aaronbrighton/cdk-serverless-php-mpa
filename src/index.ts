
import { readFileSync, existsSync } from 'fs'; // Used for reading the Bref wrapper into Docker container for building/packaging the MPA Lambda.
import * as path from 'path';
import * as apigateway from '@aws-cdk/aws-apigatewayv2';
import * as apigateway_integrations from '@aws-cdk/aws-apigatewayv2-integrations';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as cloudfront_origins from '@aws-cdk/aws-cloudfront-origins';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as rds from '@aws-cdk/aws-rds';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3_deployment from '@aws-cdk/aws-s3-deployment';
import * as wafv2 from '@aws-cdk/aws-wafv2';
import * as cdk from '@aws-cdk/core';

/**
 * Construct properties for the PHP multi-page application code and runtime environment.
 */
export interface CodeProps {
  /**
   * The path to the source code of your PHP multi-page application.
   *
   * For example:
   *
   * *__src/__*
   *
   * If the directory you point to contains a subdirectory named "public_html", that subdirectory becomes your
   * "document_root" (useful in situations where you may want configs, libraries, or other files not publicly accessible).
   *
   */
  readonly src: string;

  /**
   * The ARN of the Lambda Layer version that contains the Bref PHP "FPM" runtime to use.
   *
   * See the following page for a list of the latest Bref PHP "FPM" runtime Lambda layer version ARNs: https://raw.githubusercontent.com/brefphp/bref/master/layers.json
   *
   * @default "arn:aws:lambda:us-east-1:209497400698:layer:php-80-fpm:9"
   */
  readonly brefFpmLayerVersionArn?: string;

  /**
   * When set to true the Bref vendor dependencies are automatically packaged with your PHP multi-page application source code.
   *
   * A subdirectory "serverless-php-mpa-utils/" is created just above your "document_root", containing the Bref "vendor/autoload.php" and a
   * "wrapper.php" script that extends Bref PHP "FPM" runtime to handle routing for multi-page applications.
   *
   * To speed up CDK synth time, you may wish to manually pre-seed the "serverless-php-mpa-utils/" directory and set this property to false,
   * see the following for more information:
   *
   * https://bref.sh/docs/environment/php.html#custom-vendor-path
   *
   *
   * @default true
   */
  readonly buildWrapper?: boolean;

  /**
   * When set to true the Bref vendor dependencies are packaged with verbose output.
   *
   * Only applicable if "buildWrapper" is also true (default).
   *
   * @default false
   */
  readonly buildWrapperVerbose?: boolean;

  /**
   * The default file name used when the request URI is for a directory instead of a file.
   *
   * @default index.php
   */
  readonly directoryIndexFile?: string;

  /**
   * The file used when the request URI is for a non-existent directory or file.
   *
   * A HTTP 403 error will be returned in such an event.  By specifying a custom error page,
   * the content of that file will be used as the body of the 403 error response.
   *
   */
  readonly customErrorFile?: string;

  /**
   * The amount of memory, in MB, that is allocated to your Lambda function.
   *
   * Lambda uses this value to proportionally allocate the amount of CPU
   * power.
   *
   * https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html
   *
   * @default 1024
   */
  readonly memorySize?: number;

  /**
   * The function execution time (in seconds) after which Lambda terminates the function.
   *
   * Because the execution time affects cost, set this value
   * based on the function's expected execution time.
   *
   * Note: When using a serverless database that automatically pauses after inactivity it can
   * take up to and in some cases longer than 30 seconds for the database to become available.
   *
   * @default cdk.Duration.seconds(30)
   */
  readonly timeout?: cdk.Duration;

  /**
   * If you're not using the "Cdn" resource and you want to use a custom domain name instead of the automatically
   * generated domain name, you'll need to create a "Domain" resource and pass it here.
   */
  readonly domain?: Domain;

  /**
   * If you're using a "Database", "Filesystem", and/or set "permitAssetsBucketAccess" under the Cdn resource to "true" you'll need to
   * create a "Network" resource and pass it here.
   */
  readonly network?: Network;

  /**
   * If you're using the "Database" resource, you'll need pass it here.
   */
  readonly database?: Database;

  /**
   * When set to true the following PHP $GLOBALS will be made available to your application to make
   * it easier to bootstrap your application's database connectivity.
   *
   * $GLOBALS['RDS_USERNAME'], $GLOBALS['RDS_PASSWORD'], $GLOBALS['RDS_HOST'], $GLOBALS['RDS_DATABASE']
   *
   * @default false
   */
  readonly injectCreds?: boolean;

  /**
   * If set to true, when a request is made to your PHP multi-page app an attempt will be made to "wake"
   * the "Database" resource in case it was shutdown due to a shortage of activity.  If the connection succeeds
   * immediately your page will be loaded normally.
   *
   * If the connection to the "Database" fails, the request will be returned to the end-user immediately with an
   * "HTTP 503 Service Unavailable" response code, "Retry-After: 2" header, and custom body response as defined
   * the "databaseLoaderMessage" property.
   *
   * For browsers that don't support the "Retry-After" header (Firefox), the custom body response also contains a
   * "\<meta http-equiv="refresh" content="5">" tag.
   *
   * @default false
   */
  readonly databaseLoader?: boolean;

  /**
  * The message displayed to the end-user while the "Database" resource is waking up (typically lasts < 30 seconds).
  *
  * Only applicable if "databaseLoader" is set to "true".
  *
  * @default "Waiting for database to startup..."
  */
  readonly databaseLoaderMessage?: string;

  /**
   * If you're using the "Filesystem" resource, you'll need pass it here.
   */
  readonly filesystem?: Filesystem;

  /**
   * Which directory to mount the "Filesystem" resource to in the Lambda function.  The path will be automatically prefixed with "/mnt".
   *
   * For example:
   *
   * *"/persistent" is resolved to "/mnt/persistent"*
   *
   * https://docs.aws.amazon.com/lambda/latest/dg/configuration-filesystem.html
   *
   * @default - "/persistent"
   */
  readonly filesystemMountPoint?: string;

  /**
    * Override the default PHP temp directory ("/tmp") to reside within the "Filesystem" resource.  The path will be automatically prefixed
    * with the full path derived from "filesystemMountPoint".
    *
    * For example, if "filesystemMountPoint" is "/persistent", and "phpTempDir" is "/tmp", the full path would be:
    *
    * *"/mnt/persistent/tmp*
    *
    * Useful for scenarios where the PHP application being hosted needs a persistent temp directory across executions (ex. using PHP's default
    * session storage mechanism).
    *
    * @default - "/tmp" (resolving to path -> "/mnt/$mountPoint/tmp").
    */
  readonly phpTempDir?: string;

  /**
    * In certain situations you may want to enable additional PHP extensions within the Bref runtime.  This can
    * be achieved by specifying the additional Lambda layers and enabling within a php.ini file placed in your "src"
    * directory just above your "public_html" directory, for example:
    *
    * Layers:
    *
    * additionalLayers: [ 'arn:aws:lambda:us-east-1:403367587399:layer:gd-php-80:10' ]
    *
    * Directories:
    *
    * src/public_html/
    *
    * src/app/php/conf.d/php.ini: extension=gd
    *
    * For more details: https://bref.sh/docs/environment/php.html#extensions
    */
  readonly additionalLayers?: string[];
}

/**
 * Construct properties for the Aurora Serverless MySQL compatible database cluster.
 */
export interface DatabaseProps {
  /**
   * A "Network" resource is required to use the "Database" resource, and it should be passed in here.
   */
  readonly network: Network;

  /**
   * Name of an initial database which is automatically created inside the cluster.
   */
  readonly name: string;

  /**
   * Scaling configuration for the Aurora Serverless database cluster.
   *
   * @default
   * minCapacity: rds.AuroraCapacityUnit.ACU_2
   * maxCapacity: rds.AuroraCapacityUnit.ACU_16
   * autoPause: cdk.Duration.minutes(5)
   */
  readonly scaling?: rds.ServerlessScalingOptions;
}

/**
 * Construct properties for the EFS (NFS) filesystem for local storage persistence within the Lambda function.
 */
export interface FilesystemProps {

  /**
   * A "Network" resource is required to use the "Filesystem" resource, and it should be passed in here.
   */
  readonly network: Network;
}

/**
 * Construct properties for the Web Application Firewall (AWS WAF)
 */
export interface Waf {
  /**
   * List of CIDR notated IPv4 addresses allowed access to the application, all other requests will be blocked by AWS WAF.
   *
   * For example:
   *
   * [
   *   '8.8.8.8/32'
   * ]
   *
   */
  readonly allowListIpsV4?: string[];

  /**
   * List of IPv6 addresses allowed access to the application, all other requests will be blocked by AWS WAF.
   *
   * For example:
   *
   * [
   *   '2002::1234:abcd:ffff:c0a8:101/64'
   * ]
   *
   */
  readonly allowListIpsV6?: string[];

  /**
   * Rate limit for requests to the application from a single IP over a 5 minute period.
   *
   * If omitted, application will auto-scale within the limits of your AWS account's default service quotas.
   *
   * See the following for details on behaviour: https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html
   *
   */
  readonly rateLimit?: number;
}

/**
 * Construct properties for the CDN (CloudFront) and static assets (S3 bucket) configuration.
 */
export interface CdnProps {
  /**
   * The code resource to be protected by and delivered to end-users via the CDN.
   */
  readonly code: Code;

  /**
   * Cache control headers to send to the client by default for all static assets.
   *
   * See the following for details on behaviour: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
   *
   * @default - "no-cache"
   */
  readonly assetsCacheControl?: string;

  /**
   * Headers that the CDN (CloudFront) should pass on to your PHP MPA application from end-user requests.  These headers will
   * also be used by CloudFront's Cache-Key, assuming you're application returns Cache-Control headers.
   *
   * Useful for situations where your PHP MPA application is expecting certain custom headers, for example, WordPress's "X-WP-Nonce" header.
   *
   * By default, the only headers passed from the browser to the PHP MPA application are:
   *
   * "Authorization" (also used by Cache-Key), "Content-Type", "Origin", "User-Agent", 'X-Forwarded-Host'
   *
   * Any "customHeaders" will be merged with these defaults.
   *
   * See the following for information on CloudFront's Cache-Key on behaviour: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html
   */
  readonly customHeaders?: string[];

  /**
   * If set to true the Lambda function IAM role will be granted access to read/write from the assets bucket.  When using this property
   * you also need to provide the "network" property.
   *
   * The PHP $_ENV["ASSETS_BUCKET"] superglobal will also be populated with the S3 bucket name.
   *
   * @default - false
   */
  readonly permitAssetsBucketAccess?: boolean;

  /**
   * If desired, you can enable the optional Web Application Firewall (AWS WAF) to either lock the application down
   * to a list of whitelisted IP addresses and/or apply a rate limit rule to control scaling and/or prevent abuse.
   */
  readonly waf?: Waf;

  /**
   * If desired, you can use a custom domain name instead of the automatically
   * generated CloudFront distribution domain name.  You'll need to create a "Domain" resource and pass it here.
   */
  readonly domain?: Domain;

  /**
   * If you've enabled "permitAssetsBucketAccess" you'll need to
   * create a "Network" resource and pass it here.
   */
  readonly network?: Network;
}

/**
 * Construct properties for the custom domain configuration of the PHP multi-page app.
 */
export interface DomainProps {
  /**
   * The custom domain name to be used to access the hosted PHP multi-page app.  Use the "hostedZone" property as well if
   * you'd like Route53 records created automatically.
   */
  readonly name: string;

  /**
   * If your domain's DNS is managed outside of Route53, you've decided not to provide the "hostedZone" or you simply want to
   * provide your own TLS/SSL certificate you can import it to ACM manually and pass it in here.
   *
   * See https://docs.aws.amazon.com/acm/latest/userguide/import-certificate.html for how to import certificates to ACM.
   */
  readonly acmCertificate?: acm.ICertificate;

  /**
   * The Route53 hosted zone that responds to requests for this domain.
   *
   * If provided, an SSL/TLS certificate will be automatically generated and the necessary
   * Route53 A (IPv4) and AAAA (IPv6) records pointing to the generated HTTP API or CloudFront
   * distribution will be created.
   *
   * If you are using the "CDN" functionality an attempt will be made to also create additional
   * "www." prefixed A and AAAA records.
   *
   * See the following for information on how to create a hosted zone in Route53: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html
   */
  readonly hostedZone?: route53.IHostedZone;
}

/**
 * OPTIONAL: Use `Domain` to use a custom domain name.
 */
export class Domain extends cdk.Construct {
  /**
   * The custom domain name to be used to access the hosted PHP multi-page app.
   */
  readonly name: string;
  /**
   * The imported or generated ACM certificate associated with this domain name.
   */
  readonly acmCertificate: acm.ICertificate;
  /**
   * The Route53 hosted zone that responds to requests for this domain name.
   */
  readonly hostedZone?: route53.IHostedZone;

  constructor(scope: cdk.Construct, id: string, props: DomainProps) {
    super(scope, id);

    const propsWithDefaults: DomainProps = {
      ...props,
    };
    this.name = propsWithDefaults.name;
    this.hostedZone = propsWithDefaults.hostedZone;

    // If a pre-generated/imported ACM certificate wasn't provided, attempt generate one.
    this.acmCertificate = propsWithDefaults.acmCertificate ?? new acm.Certificate(this, 'AcmCertificate', {
      domainName: this.name,
      subjectAlternativeNames: [`www.${this.name}`],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });
  }

  /**
   * Creates A and AAAA records in Route53 for the given domain name pointing to the provided target (CloudFront or HTTP API).
   */
  public addRecords(targetResource: apigateway.DomainName | cloudfront.Distribution): this {

    let recordNames = [
      this.name,
    ];

    // Resolve the correct type of Route53 target based on the targetResource provided (CloudFront Distribution vs. HTTP API).
    let target: route53.IAliasRecordTarget;
    if (targetResource instanceof apigateway.DomainName) {
      target = new targets.ApiGatewayv2DomainProperties(targetResource.regionalDomainName, targetResource.regionalHostedZoneId);
    } else if (targetResource instanceof cloudfront.Distribution) {
      target = new targets.CloudFrontTarget(targetResource);

      // In the case of CloudFront, let's also create the prefixed "www." domain.
      recordNames.push(`www.${this.name}`);
    }

    // Create the records.
    recordNames.forEach((domain) => {
      if (this.hostedZone) {
        new route53.ARecord(this, `${domain}ARecord`, {
          zone: this.hostedZone,
          target: route53.RecordTarget.fromAlias(target),
          recordName: domain,
        });

        new route53.AaaaRecord(this, `${domain}AaaaRecord`, {
          zone: this.hostedZone,
          target: route53.RecordTarget.fromAlias(target),
          recordName: domain,
        });
      }
    });

    return this;
  }
}

/**
 * OPTIONAL: Use `Network` if you're planning to also use `Database`, `Filesystem`, and/or set the `permitAssetsBucketAccess` property to true in `Cdn`.
 */
export class Network extends cdk.Construct {
  readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      subnetConfiguration: [
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    });
  }
}

/**
 * OPTIONAL: Use `Database` to create an Aurora Serverless MySQL-compatible database cluster.
 */
export class Database extends cdk.Construct {
  readonly serverlessCluster: rds.ServerlessCluster;

  constructor(scope: cdk.Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const propsWithDefaults: DatabaseProps = {
      ...props,
    };

    // Create an interface endpoint for secrets manager, so our Lambda function can securely query for the generated Database credentials.
    propsWithDefaults.network?.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    this.serverlessCluster = new rds.ServerlessCluster(this, 'RdsCluster', {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      vpc: propsWithDefaults.network.vpc,
      vpcSubnets: propsWithDefaults.network.vpc ? {
        subnetType: ec2.SubnetType.ISOLATED,
      } : undefined,
      defaultDatabaseName: propsWithDefaults.name,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });
  }
}

/**
 * OPTIONAL: Use `Filesystem` to create an EFS (NFS) filesytem for persistent storage across application requests.
 */
export class Filesystem extends cdk.Construct {
  readonly efsFilesystem: efs.FileSystem;
  readonly efsAccessPoint: efs.AccessPoint;

  constructor(scope: cdk.Construct, id: string, props: FilesystemProps) {
    super(scope, id);

    const propsWithDefaults: FilesystemProps = {
      ...props,
    };

    this.efsFilesystem = new efs.FileSystem(this, 'EfsFileSystem', {
      vpc: propsWithDefaults.network.vpc,
      vpcSubnets: propsWithDefaults.network.vpc ? {
        subnetType: ec2.SubnetType.ISOLATED,
      } : undefined,
    });

    this.efsAccessPoint = this.efsFilesystem.addAccessPoint('EfsAccessPoint', {
      createAcl: {
        ownerUid: '0',
        ownerGid: '0',
        permissions: '777',
      },
      posixUser: {
        uid: '0',
        gid: '0',
      },
    });
  }
}

/**
 * REQUIRED: Use `Code` to reference your PHP multi-page application, and tweak it's runtime environment.
 */
export class Code extends cdk.Construct {
  /**
   * The path to the source code of your PHP multi-page app.
   */
  readonly src: string;
  /**
   * The Lambda function resource that will host the PHP multi-page app.
   */
  readonly function: lambda.Function;
  /**
   * The HTTP API resource that will be used to make the Lambda function HTTP accessible.
   */
  readonly httpApi: apigateway.HttpApi;
  /**
   * Optional API Gateway resource for a custom domain name, used as a target for Route53.
   */
  readonly apiDomainName?: apigateway.DomainName;

  constructor(scope: cdk.Construct, id: string, props: CodeProps) {
    super(scope, id);

    const propsWithDefaults: CodeProps = {
      brefFpmLayerVersionArn: 'arn:aws:lambda:us-east-1:209497400698:layer:php-80-fpm:9',
      buildWrapper: true,
      directoryIndexFile: 'index.php',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      buildWrapperVerbose: false,
      injectCreds: false,
      databaseLoader: false,
      databaseLoaderMessage: 'Waiting for database to startup...',
      filesystemMountPoint: '/persistent',
      phpTempDir: '/tmp',
      ...props,
    };
    this.src = propsWithDefaults.src;

    // We need to prep the wrapper that is used to enable PHP multi-page app functionality, as well as some of the value-add cdk-serverless-php-mpa features.
    const lambdaAssetCodeBuildCommands = propsWithDefaults.buildWrapper ? [
      'mkdir /asset-output/cdk-serverless-php-mpa-utils',
      [
        `echo "${Buffer.from(readFileSync(path.join(__dirname, 'cdk-serverless-php-mpa-utils/wrapper.php'), 'utf-8')).toString('base64')}"`,
        '| base64 -d > /asset-output/cdk-serverless-php-mpa-utils/wrapper.php',
      ].join(' '),
      'composer require -d /asset-output/cdk-serverless-php-mpa-utils/ bref/bref' + (!propsWithDefaults.buildWrapperVerbose ? ' >/dev/null 2>&1' : ''),
      'composer require -d /asset-output/cdk-serverless-php-mpa-utils/ guzzlehttp/guzzle' + (!propsWithDefaults.buildWrapperVerbose ? ' >/dev/null 2>&1' : ''),
      'if [ -d "/asset-input/public_html" ]; then cp -au /asset-input/* /asset-output/; else mkdir /asset-output/public_html && cp -au /asset-input/* /asset-output/public_html/; fi',
    ] : [];
    propsWithDefaults.injectCreds && lambdaAssetCodeBuildCommands.push('composer require -d /asset-output/cdk-serverless-php-mpa-utils/ aws/aws-sdk-php' + (!propsWithDefaults.buildWrapperVerbose ? ' >/dev/null 2>&1' : ''));
    propsWithDefaults.injectCreds && lambdaAssetCodeBuildCommands.push('mkdir -p /asset-output/php/conf.d && echo "extension=apcu" > /asset-output/php/conf.d/apcu.ini');

    this.function = new lambda.Function(this, 'Lambda', {
      runtime: lambda.Runtime.PROVIDED_AL2,
      memorySize: propsWithDefaults.memorySize,
      timeout: propsWithDefaults.timeout,
      handler: 'cdk-serverless-php-mpa-utils/wrapper.php',
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(this, 'BrefPhpFpmLayer', propsWithDefaults.brefFpmLayerVersionArn ?? ''),
      ],
      code: lambda.Code.fromAsset(propsWithDefaults.src, propsWithDefaults.buildWrapper ? {
        bundling: {
          command: [
            'bash', '-c',
            lambdaAssetCodeBuildCommands.concat([
              'echo Downloaded $(du -sh /asset-output/cdk-serverless-php-mpa-utils/) during asset build',
            ],
            ).join(' && '),
          ],
          image: cdk.DockerImage.fromRegistry('composer'),
        },
      } : undefined),
      environment: {
        BREF_BINARY_RESPONSES: '1', // Needed for returning binary content like image files - https://bref.sh/docs/runtimes/http.html#binary-requests-and-responses
        BREF_AUTOLOAD_PATH: '/var/task/cdk-serverless-php-mpa-utils/vendor/autoload.php',
      },
      vpc: propsWithDefaults.network?.vpc,
      vpcSubnets: propsWithDefaults.network?.vpc ? {
        subnetType: ec2.SubnetType.ISOLATED,
      } : undefined,
      filesystem: propsWithDefaults.filesystem?.efsAccessPoint ? lambda.FileSystem.fromEfsAccessPoint(propsWithDefaults.filesystem?.efsAccessPoint, '/mnt'+propsWithDefaults.filesystemMountPoint) : undefined,
    });

    // The wrapper that is used to enable PHP multi-page app functionality has features switched on via some of these environment variables.
    propsWithDefaults.directoryIndexFile && this.function.addEnvironment('SERVERLESS_PHP_MPA_INDEX_FILE', propsWithDefaults.directoryIndexFile);
    propsWithDefaults.customErrorFile && this.function.addEnvironment('SERVERLESS_PHP_MPA_REWRITE_FILE', propsWithDefaults.customErrorFile);
    propsWithDefaults.database?.serverlessCluster.secret && this.function.addEnvironment('RDS_SECRET_ARN', propsWithDefaults.database?.serverlessCluster.secret.secretArn);
    propsWithDefaults.injectCreds && this.function.addEnvironment('RDS_SECRET_INJECT', '');
    propsWithDefaults.databaseLoader && this.function.addEnvironment('RDS_LOADER', '');
    propsWithDefaults.databaseLoaderMessage && this.function.addEnvironment('RDS_LOADER_MESSAGE', propsWithDefaults.databaseLoaderMessage);
    propsWithDefaults.filesystem && this.function.addEnvironment('TMPDIR', '/mnt'+propsWithDefaults.filesystemMountPoint+propsWithDefaults.phpTempDir);

    // Add additional layers to the Lambda function
    if (propsWithDefaults.additionalLayers) {
      propsWithDefaults.additionalLayers.forEach(layer => {
        const splitLayer = layer.split(':');
        const layerId = splitLayer[splitLayer.length-2].replace('-', '');
        this.function.addLayers(lambda.LayerVersion.fromLayerVersionArn(this, layerId, layer));
      });
    }

    // If a Database resource is being used let's make sure our Lambda can reach it and has access to read from it's generated Secrets Manager secret.
    if (propsWithDefaults.database?.serverlessCluster.secret) {
      (propsWithDefaults.database?.serverlessCluster.node.findChild('SecurityGroup') as ec2.SecurityGroup).addIngressRule((this.function.node.findChild('SecurityGroup') as ec2.SecurityGroup), ec2.Port.tcp(3306), 'Allow MySQL connections from the MPA Lambda function');
      propsWithDefaults.database?.serverlessCluster.secret?.grantRead(this.function);
    }

    // HTTP API for exposing the PHP MPA Lambda to the world
    this.httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      defaultIntegration: new apigateway_integrations.LambdaProxyIntegration({
        handler: this.function,
      }),
      defaultDomainMapping: propsWithDefaults.domain ? {
        domainName: this.apiDomainName = new apigateway.DomainName(this, 'ApiDomainName', {
          domainName: propsWithDefaults.domain?.name,
          certificate: propsWithDefaults.domain?.acmCertificate,
        }),
      } : undefined,
    });

    // Automatically create the Route53 records if Domain was passed in with a hostedZone specified.
    propsWithDefaults.domain?.hostedZone && this.apiDomainName && propsWithDefaults.domain?.addRecords(this.apiDomainName);
  }
}

/**
 * RECOMMENDED: Use `Cdn` to protect your application behind a content-delivery network, web application firewall, and improve static-content delivery.
 */
export class Cdn extends cdk.Construct {
  /**
   * The CloudFront Distribution resource that will be used to make the Lambda function HTTP accessible.
   */
  readonly distribution: cloudfront.Distribution;
  /**
   * The optional Web Application Firewall (AWS WAF WebACL) resource
   */
  readonly webAcl?: wafv2.CfnWebACL;
  /**
   * The CloudFront Cache Policy used by the Distribution.
   *
   * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html
   */
  readonly cachePolicy: cloudfront.CachePolicy;
  /**
   * The CloudFront Origin Request Policy used by the Distribution to relay request to the HTTP API origin.
   *
   * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html
   */
  readonly apiOriginRequestPolicy: cloudfront.OriginRequestPolicy;
  /**
   * The S3 Assets bucket that the Code.src will be replicated to for more efficient serving of non-dynamic files
   * (images, css, js, etc...).
   */
  readonly assetsBucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string, props: CdnProps) {
    super(scope, id);

    const propsWithDefaults: CdnProps = {
      assetsCacheControl: 'no-cache',
      permitAssetsBucketAccess: false,
      customHeaders: [],
      ...props,
    };

    if (propsWithDefaults.waf) {
      let wafAclRules: Array<wafv2.CfnWebACL.RuleProperty | cdk.IResolvable> | cdk.IResolvable = [];

      propsWithDefaults.waf.rateLimit && wafAclRules.push({
        action: {
          block: {},
        },
        name: 'rate-limit',
        priority: 0,
        statement: {
          rateBasedStatement: {
            aggregateKeyType: 'IP',
            limit: propsWithDefaults.waf.rateLimit,
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `${this.node.id}-WafAclMetric-RateLimit`,
          sampledRequestsEnabled: true,
        },
      });

      (propsWithDefaults.waf.allowListIpsV4 || propsWithDefaults.waf.allowListIpsV6) && wafAclRules.push({
        action: {
          allow: {},
        },
        name: 'ip-allowlist',
        priority: 1,
        statement: {
          orStatement: {
            statements: [
              {
                ipSetReferenceStatement: {
                  arn: new wafv2.CfnIPSet(this, 'WafIpV4Set', {
                    addresses: propsWithDefaults.waf.allowListIpsV4 || [],
                    ipAddressVersion: 'IPV4',
                    scope: 'CLOUDFRONT',
                  }).attrArn,
                },
              },
              {
                ipSetReferenceStatement: {
                  arn: new wafv2.CfnIPSet(this, 'WafIpV6Set', {
                    addresses: propsWithDefaults.waf.allowListIpsV6 || [],
                    ipAddressVersion: 'IPV6',
                    scope: 'CLOUDFRONT',
                  }).attrArn,
                },
              },
            ],
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `${this.node.id}-WafAclMetric-AllowList`,
          sampledRequestsEnabled: true,
        },
      });


      this.webAcl = new wafv2.CfnWebACL(this, 'WafAcl', {
        defaultAction: (propsWithDefaults.waf.allowListIpsV4 || propsWithDefaults.waf.allowListIpsV6) ? { block: {} } : { allow: {} },
        scope: 'CLOUDFRONT',
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `${this.node.id}-WafAclMetric`,
          sampledRequestsEnabled: true,
        },
        rules: wafAclRules,
      });
    }

    // ASSETS BUCKET
    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // It's important to ensure the assetsBucket can only be accessed from within the VPC, as an info leak from within the Lambda function could expose write
    // access to the S3 assetsBucket.
    if (propsWithDefaults.network) {
      const vpcS3Endpoint = propsWithDefaults.network.vpc.addGatewayEndpoint('VpcS3Endpoint', {
        service: ec2.GatewayVpcEndpointAwsService.S3,
      });

      if (propsWithDefaults.permitAssetsBucketAccess && propsWithDefaults.code.function.role) {
        propsWithDefaults.code?.function.addEnvironment('ASSETS_BUCKET', this.assetsBucket.bucketName);
        this.assetsBucket.grantReadWrite(propsWithDefaults.code.function);
        this.assetsBucket.grantPutAcl(propsWithDefaults.code.function);
        this.assetsBucket.addToResourcePolicy(new iam.PolicyStatement({
          principals: [new iam.ArnPrincipal(propsWithDefaults.code.function.role.roleArn)],
          actions: ['s3:*'],
          effect: iam.Effect.DENY,
          resources: [this.assetsBucket.bucketArn, this.assetsBucket.arnForObjects('*')],
          conditions: {
            StringNotEquals: {
              'aws:SourceVpce': vpcS3Endpoint.vpcEndpointId,
              'aws:CalledViaLast': 'cloudformation.amazonaws.com',
            },
          },
        }));
      }
    }

    // Copy the public code and assets for the PHP app to the S3 bucket for more optimal serving of static assets via S3->CloudFront.
    new s3_deployment.BucketDeployment(this, 'AssetsDeployment', {
      sources: [s3_deployment.Source.asset(propsWithDefaults.code.src +
        (existsSync(propsWithDefaults.code.src+'public_html/') ? 'public_html/' : ''))],
      destinationBucket: this.assetsBucket,
      cacheControl: [s3_deployment.CacheControl.fromString(propsWithDefaults.assetsCacheControl ?? 'no-cache')],
      memoryLimit: 1024,
      prune: props.permitAssetsBucketAccess ? false : true,
      retainOnDelete: props.permitAssetsBucketAccess ? true : false,
      vpc: propsWithDefaults.network?.vpc,
      vpcSubnets: propsWithDefaults.network?.vpc ? {
        subnetType: ec2.SubnetType.ISOLATED,
      } : undefined,
    });

    // CLOUDFRONT
    const cloudfrontDistributionHttpApiOrigin = new cloudfront_origins.HttpOrigin(`${propsWithDefaults.code?.httpApi.apiId}.execute-api.${cdk.Stack.of(this).region}.amazonaws.com`);

    this.cachePolicy = new cloudfront.CachePolicy(this, 'CloudfrontCachePolicyForApi', {
      cookieBehavior: cloudfront.CacheCookieBehavior.all(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Authorization', 'x-forwarded-host', ...propsWithDefaults.customHeaders ?? []),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      defaultTtl: cdk.Duration.seconds(0),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });

    this.distribution = new cloudfront.Distribution(this, 'CloudfrontDistribution', {
      defaultBehavior: {
        origin: new cloudfront_origins.OriginGroup({
          primaryOrigin: new cloudfront_origins.S3Origin(this.assetsBucket),
          fallbackOrigin: cloudfrontDistributionHttpApiOrigin,
          fallbackStatusCodes: [403],
        }),
        cachePolicy: this.cachePolicy,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
      },
      webAclId: this.webAcl?.attrArn || undefined,
      domainNames: propsWithDefaults.domain ? [
        propsWithDefaults.domain?.name,
        `www.${propsWithDefaults.domain?.name}`,
      ] : undefined,
      certificate: propsWithDefaults.domain?.acmCertificate,
    });

    this.apiOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'CloudfrontOriginRequestPolicyForApi', {
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList('Content-Type', 'Origin', 'User-Agent', 'x-forwarded-host', ...propsWithDefaults.customHeaders ?? []),
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
    });

    const cloudfrontFunction = new cloudfront.Function(this, 'CloudfrontFunction', {
      code: cloudfront.FunctionCode.fromInline('function handler(event){event.request.headers[\'x-forwarded-host\']={value: event.request.headers.host.value};return  event.request;}'),
    });

    // For any requests that could be deemed for dynamic pages, ensure they get routed to the HTTP API origin instead of S3.
    ['/', '*/', '*.php'].forEach(pathPattern =>
      this.distribution.addBehavior(pathPattern, cloudfrontDistributionHttpApiOrigin, {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: this.cachePolicy,
        originRequestPolicy: this.apiOriginRequestPolicy,
        functionAssociations: [{
          function: cloudfrontFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      }),
    );

    // Automatically create the Route53 records if Domain was passed in with a hostedZone specified.
    propsWithDefaults.domain?.hostedZone && propsWithDefaults.domain?.addRecords(this.distribution);
  }
}