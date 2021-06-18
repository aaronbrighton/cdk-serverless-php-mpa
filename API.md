# API Reference

**Classes**

Name|Description
----|-----------
[Cdn](#cdk-serverless-php-mpa-cdn)|RECOMMENDED: Use `Cdn` to protect your application behind a content-delivery network, web application firewall, and improve static-content delivery.
[Code](#cdk-serverless-php-mpa-code)|REQUIRED: Use `Code` to reference your PHP multi-page application, and tweak it's runtime environment.
[Database](#cdk-serverless-php-mpa-database)|OPTIONAL: Use `Database` to create an Aurora Serverless MySQL-compatible database cluster.
[Domain](#cdk-serverless-php-mpa-domain)|OPTIONAL: Use `Domain` to use a custom domain name.
[Filesystem](#cdk-serverless-php-mpa-filesystem)|OPTIONAL: Use `Filesystem` to create an EFS (NFS) filesytem for persistent storage across application requests.
[Network](#cdk-serverless-php-mpa-network)|OPTIONAL: Use `Network` if you're planning to also use `Database`, `Filesystem`, and/or set the `permitAssetsBucketAccess` property to true in `Cdn`.


**Structs**

Name|Description
----|-----------
[CdnProps](#cdk-serverless-php-mpa-cdnprops)|Construct properties for the CDN (CloudFront) and static assets (S3 bucket) configuration.
[CodeProps](#cdk-serverless-php-mpa-codeprops)|Construct properties for the PHP multi-page application code and runtime environment.
[DatabaseProps](#cdk-serverless-php-mpa-databaseprops)|Construct properties for the Aurora Serverless MySQL compatible database cluster.
[DomainProps](#cdk-serverless-php-mpa-domainprops)|Construct properties for the custom domain configuration of the PHP multi-page app.
[FilesystemProps](#cdk-serverless-php-mpa-filesystemprops)|Construct properties for the EFS (NFS) filesystem for local storage persistence within the Lambda function.
[Waf](#cdk-serverless-php-mpa-waf)|Construct properties for the Web Application Firewall (AWS WAF).



## class Cdn 🔹 <a id="cdk-serverless-php-mpa-cdn"></a>

RECOMMENDED: Use `Cdn` to protect your application behind a content-delivery network, web application firewall, and improve static-content delivery.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Cdn(scope: Construct, id: string, props: CdnProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[CdnProps](#cdk-serverless-php-mpa-cdnprops)</code>)  *No description*
  * **code** (<code>[Code](#cdk-serverless-php-mpa-code)</code>)  The code resource to be protected by and delivered to end-users via the CDN. 
  * **assetsCacheControl** (<code>string</code>)  Cache control headers to send to the client by default for all static assets. __*Default*__: "no-cache"
  * **customHeaders** (<code>Array<string></code>)  Headers that the CDN (CloudFront) should pass on to your PHP MPA application from end-user requests. __*Optional*__
  * **domain** (<code>[Domain](#cdk-serverless-php-mpa-domain)</code>)  If desired, you can use a custom domain name instead of the automatically generated CloudFront distribution domain name. __*Optional*__
  * **network** (<code>[Network](#cdk-serverless-php-mpa-network)</code>)  If you've enabled "permitAssetsBucketAccess" you'll need to create a "Network" resource and pass it here. __*Optional*__
  * **permitAssetsBucketAccess** (<code>boolean</code>)  If set to true the Lambda function IAM role will be granted access to read/write from the assets bucket. __*Default*__: false
  * **waf** (<code>[Waf](#cdk-serverless-php-mpa-waf)</code>)  If desired, you can enable the optional Web Application Firewall (AWS WAF) to either lock the application down to a list of whitelisted IP addresses and/or apply a rate limit rule to control scaling and/or prevent abuse. __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**apiOriginRequestPolicy**🔹 | <code>[OriginRequestPolicy](#aws-cdk-aws-cloudfront-originrequestpolicy)</code> | The CloudFront Origin Request Policy used by the Distribution to relay request to the HTTP API origin.
**assetsBucket**🔹 | <code>[Bucket](#aws-cdk-aws-s3-bucket)</code> | The S3 Assets bucket that the Code.src will be replicated to for more efficient serving of non-dynamic files (images, css, js, etc...).
**cachePolicy**🔹 | <code>[CachePolicy](#aws-cdk-aws-cloudfront-cachepolicy)</code> | The CloudFront Cache Policy used by the Distribution.
**distribution**🔹 | <code>[Distribution](#aws-cdk-aws-cloudfront-distribution)</code> | The CloudFront Distribution resource that will be used to make the Lambda function HTTP accessible.
**webAcl**?🔹 | <code>[CfnWebACL](#aws-cdk-aws-wafv2-cfnwebacl)</code> | The optional Web Application Firewall (AWS WAF WebACL) resource.<br/>__*Optional*__



## class Code 🔹 <a id="cdk-serverless-php-mpa-code"></a>

REQUIRED: Use `Code` to reference your PHP multi-page application, and tweak it's runtime environment.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Code(scope: Construct, id: string, props: CodeProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[CodeProps](#cdk-serverless-php-mpa-codeprops)</code>)  *No description*
  * **src** (<code>string</code>)  The path to the source code of your PHP multi-page application. 
  * **brefFpmLayerVersionArn** (<code>string</code>)  The ARN of the Lambda Layer version that contains the Bref PHP "FPM" runtime to use. __*Default*__: "arn:aws:lambda:us-east-1:209497400698:layer:php-80-fpm:9"
  * **buildWrapper** (<code>boolean</code>)  When set to true the Bref vendor dependencies are automatically packaged with your PHP multi-page application source code. __*Default*__: true
  * **buildWrapperVerbose** (<code>boolean</code>)  When set to true the Bref vendor dependencies are packaged with verbose output. __*Default*__: false
  * **customErrorFile** (<code>string</code>)  The file used when the request URI is for a non-existent directory or file. __*Optional*__
  * **database** (<code>[Database](#cdk-serverless-php-mpa-database)</code>)  If you're using the "Database" resource, you'll need pass it here. __*Optional*__
  * **databaseLoader** (<code>boolean</code>)  If set to true, when a request is made to your PHP multi-page app an attempt will be made to "wake" the "Database" resource in case it was shutdown due to a shortage of activity. __*Default*__: false
  * **databaseLoaderMessage** (<code>string</code>)  The message displayed to the end-user while the "Database" resource is waking up (typically lasts < 30 seconds). __*Default*__: "Waiting for database to startup..."
  * **directoryIndexFile** (<code>string</code>)  The default file name used when the request URI is for a directory instead of a file. __*Default*__: index.php
  * **domain** (<code>[Domain](#cdk-serverless-php-mpa-domain)</code>)  If you're not using the "Cdn" resource and you want to use a custom domain name instead of the automatically generated domain name, you'll need to create a "Domain" resource and pass it here. __*Optional*__
  * **filesystem** (<code>[Filesystem](#cdk-serverless-php-mpa-filesystem)</code>)  If you're using the "Filesystem" resource, you'll need pass it here. __*Optional*__
  * **filesystemMountPoint** (<code>string</code>)  Which directory to mount the "Filesystem" resource to in the Lambda function. __*Default*__: "/persistent"
  * **injectCreds** (<code>boolean</code>)  When set to true the following PHP $GLOBALS will be made available to your application to make it easier to bootstrap your application's database connectivity. __*Default*__: false
  * **memorySize** (<code>number</code>)  The amount of memory, in MB, that is allocated to your Lambda function. __*Default*__: 1024
  * **network** (<code>[Network](#cdk-serverless-php-mpa-network)</code>)  If you're using a "Database", "Filesystem", and/or set "permitAssetsBucketAccess" under the Cdn resource to "true" you'll need to create a "Network" resource and pass it here. __*Optional*__
  * **phpTempDir** (<code>string</code>)  Override the default PHP temp directory ("/tmp") to reside within the "Filesystem" resource. __*Default*__: "/tmp" (resolving to path -> "/mnt/$mountPoint/tmp").
  * **timeout** (<code>[Duration](#aws-cdk-core-duration)</code>)  The function execution time (in seconds) after which Lambda terminates the function. __*Default*__: cdk.Duration.seconds(30)



### Properties


Name | Type | Description 
-----|------|-------------
**function**🔹 | <code>[Function](#aws-cdk-aws-lambda-function)</code> | The Lambda function resource that will host the PHP multi-page app.
**httpApi**🔹 | <code>[HttpApi](#aws-cdk-aws-apigatewayv2-httpapi)</code> | The HTTP API resource that will be used to make the Lambda function HTTP accessible.
**src**🔹 | <code>string</code> | The path to the source code of your PHP multi-page app.
**apiDomainName**?🔹 | <code>[DomainName](#aws-cdk-aws-apigatewayv2-domainname)</code> | Optional API Gateway resource for a custom domain name, used as a target for Route53.<br/>__*Optional*__



## class Database 🔹 <a id="cdk-serverless-php-mpa-database"></a>

OPTIONAL: Use `Database` to create an Aurora Serverless MySQL-compatible database cluster.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Database(scope: Construct, id: string, props: DatabaseProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[DatabaseProps](#cdk-serverless-php-mpa-databaseprops)</code>)  *No description*
  * **name** (<code>string</code>)  Name of an initial database which is automatically created inside the cluster. 
  * **network** (<code>[Network](#cdk-serverless-php-mpa-network)</code>)  A "Network" resource is required to use the "Database" resource, and it should be passed in here. 
  * **scaling** (<code>[ServerlessScalingOptions](#aws-cdk-aws-rds-serverlessscalingoptions)</code>)  Scaling configuration for the Aurora Serverless database cluster. __*Default*__: minCapacity: rds.AuroraCapacityUnit.ACU_2 maxCapacity: rds.AuroraCapacityUnit.ACU_16 autoPause: cdk.Duration.minutes(5)



### Properties


Name | Type | Description 
-----|------|-------------
**serverlessCluster**🔹 | <code>[ServerlessCluster](#aws-cdk-aws-rds-serverlesscluster)</code> | <span></span>



## class Domain 🔹 <a id="cdk-serverless-php-mpa-domain"></a>

OPTIONAL: Use `Domain` to use a custom domain name.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Domain(scope: Construct, id: string, props: DomainProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[DomainProps](#cdk-serverless-php-mpa-domainprops)</code>)  *No description*
  * **name** (<code>string</code>)  The custom domain name to be used to access the hosted PHP multi-page app. 
  * **acmCertificate** (<code>[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)</code>)  If your domain's DNS is managed outside of Route53, you've decided not to provide the "hostedZone" or you simply want to provide your own TLS/SSL certificate you can import it to ACM manually and pass it in here. __*Optional*__
  * **hostedZone** (<code>[IHostedZone](#aws-cdk-aws-route53-ihostedzone)</code>)  The Route53 hosted zone that responds to requests for this domain. __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**acmCertificate**🔹 | <code>[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)</code> | The imported or generated ACM certificate associated with this domain name.
**name**🔹 | <code>string</code> | The custom domain name to be used to access the hosted PHP multi-page app.
**hostedZone**?🔹 | <code>[IHostedZone](#aws-cdk-aws-route53-ihostedzone)</code> | The Route53 hosted zone that responds to requests for this domain name.<br/>__*Optional*__

### Methods


#### addRecords(targetResource)🔹 <a id="cdk-serverless-php-mpa-domain-addrecords"></a>

Creates A and AAAA records in Route53 for the given domain name pointing to the provided target (CloudFront or HTTP API).

```ts
addRecords(targetResource: Distribution &#124; DomainName): Domain
```

* **targetResource** (<code>[Distribution](#aws-cdk-aws-cloudfront-distribution) &#124; [DomainName](#aws-cdk-aws-apigatewayv2-domainname)</code>)  *No description*

__Returns__:
* <code>[Domain](#cdk-serverless-php-mpa-domain)</code>



## class Filesystem 🔹 <a id="cdk-serverless-php-mpa-filesystem"></a>

OPTIONAL: Use `Filesystem` to create an EFS (NFS) filesytem for persistent storage across application requests.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Filesystem(scope: Construct, id: string, props: FilesystemProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[FilesystemProps](#cdk-serverless-php-mpa-filesystemprops)</code>)  *No description*
  * **network** (<code>[Network](#cdk-serverless-php-mpa-network)</code>)  A "Network" resource is required to use the "Filesystem" resource, and it should be passed in here. 



### Properties


Name | Type | Description 
-----|------|-------------
**efsAccessPoint**🔹 | <code>[AccessPoint](#aws-cdk-aws-efs-accesspoint)</code> | <span></span>
**efsFilesystem**🔹 | <code>[FileSystem](#aws-cdk-aws-efs-filesystem)</code> | <span></span>



## class Network 🔹 <a id="cdk-serverless-php-mpa-network"></a>

OPTIONAL: Use `Network` if you're planning to also use `Database`, `Filesystem`, and/or set the `permitAssetsBucketAccess` property to true in `Cdn`.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Network(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*



### Properties


Name | Type | Description 
-----|------|-------------
**vpc**🔹 | <code>[Vpc](#aws-cdk-aws-ec2-vpc)</code> | <span></span>



## struct CdnProps 🔹 <a id="cdk-serverless-php-mpa-cdnprops"></a>


Construct properties for the CDN (CloudFront) and static assets (S3 bucket) configuration.



Name | Type | Description 
-----|------|-------------
**code**🔹 | <code>[Code](#cdk-serverless-php-mpa-code)</code> | The code resource to be protected by and delivered to end-users via the CDN.
**assetsCacheControl**?🔹 | <code>string</code> | Cache control headers to send to the client by default for all static assets.<br/>__*Default*__: "no-cache"
**customHeaders**?🔹 | <code>Array<string></code> | Headers that the CDN (CloudFront) should pass on to your PHP MPA application from end-user requests.<br/>__*Optional*__
**domain**?🔹 | <code>[Domain](#cdk-serverless-php-mpa-domain)</code> | If desired, you can use a custom domain name instead of the automatically generated CloudFront distribution domain name.<br/>__*Optional*__
**network**?🔹 | <code>[Network](#cdk-serverless-php-mpa-network)</code> | If you've enabled "permitAssetsBucketAccess" you'll need to create a "Network" resource and pass it here.<br/>__*Optional*__
**permitAssetsBucketAccess**?🔹 | <code>boolean</code> | If set to true the Lambda function IAM role will be granted access to read/write from the assets bucket.<br/>__*Default*__: false
**waf**?🔹 | <code>[Waf](#cdk-serverless-php-mpa-waf)</code> | If desired, you can enable the optional Web Application Firewall (AWS WAF) to either lock the application down to a list of whitelisted IP addresses and/or apply a rate limit rule to control scaling and/or prevent abuse.<br/>__*Optional*__



## struct CodeProps 🔹 <a id="cdk-serverless-php-mpa-codeprops"></a>


Construct properties for the PHP multi-page application code and runtime environment.



Name | Type | Description 
-----|------|-------------
**src**🔹 | <code>string</code> | The path to the source code of your PHP multi-page application.
**brefFpmLayerVersionArn**?🔹 | <code>string</code> | The ARN of the Lambda Layer version that contains the Bref PHP "FPM" runtime to use.<br/>__*Default*__: "arn:aws:lambda:us-east-1:209497400698:layer:php-80-fpm:9"
**buildWrapper**?🔹 | <code>boolean</code> | When set to true the Bref vendor dependencies are automatically packaged with your PHP multi-page application source code.<br/>__*Default*__: true
**buildWrapperVerbose**?🔹 | <code>boolean</code> | When set to true the Bref vendor dependencies are packaged with verbose output.<br/>__*Default*__: false
**customErrorFile**?🔹 | <code>string</code> | The file used when the request URI is for a non-existent directory or file.<br/>__*Optional*__
**database**?🔹 | <code>[Database](#cdk-serverless-php-mpa-database)</code> | If you're using the "Database" resource, you'll need pass it here.<br/>__*Optional*__
**databaseLoader**?🔹 | <code>boolean</code> | If set to true, when a request is made to your PHP multi-page app an attempt will be made to "wake" the "Database" resource in case it was shutdown due to a shortage of activity.<br/>__*Default*__: false
**databaseLoaderMessage**?🔹 | <code>string</code> | The message displayed to the end-user while the "Database" resource is waking up (typically lasts < 30 seconds).<br/>__*Default*__: "Waiting for database to startup..."
**directoryIndexFile**?🔹 | <code>string</code> | The default file name used when the request URI is for a directory instead of a file.<br/>__*Default*__: index.php
**domain**?🔹 | <code>[Domain](#cdk-serverless-php-mpa-domain)</code> | If you're not using the "Cdn" resource and you want to use a custom domain name instead of the automatically generated domain name, you'll need to create a "Domain" resource and pass it here.<br/>__*Optional*__
**filesystem**?🔹 | <code>[Filesystem](#cdk-serverless-php-mpa-filesystem)</code> | If you're using the "Filesystem" resource, you'll need pass it here.<br/>__*Optional*__
**filesystemMountPoint**?🔹 | <code>string</code> | Which directory to mount the "Filesystem" resource to in the Lambda function.<br/>__*Default*__: "/persistent"
**injectCreds**?🔹 | <code>boolean</code> | When set to true the following PHP $GLOBALS will be made available to your application to make it easier to bootstrap your application's database connectivity.<br/>__*Default*__: false
**memorySize**?🔹 | <code>number</code> | The amount of memory, in MB, that is allocated to your Lambda function.<br/>__*Default*__: 1024
**network**?🔹 | <code>[Network](#cdk-serverless-php-mpa-network)</code> | If you're using a "Database", "Filesystem", and/or set "permitAssetsBucketAccess" under the Cdn resource to "true" you'll need to create a "Network" resource and pass it here.<br/>__*Optional*__
**phpTempDir**?🔹 | <code>string</code> | Override the default PHP temp directory ("/tmp") to reside within the "Filesystem" resource.<br/>__*Default*__: "/tmp" (resolving to path -> "/mnt/$mountPoint/tmp").
**timeout**?🔹 | <code>[Duration](#aws-cdk-core-duration)</code> | The function execution time (in seconds) after which Lambda terminates the function.<br/>__*Default*__: cdk.Duration.seconds(30)



## struct DatabaseProps 🔹 <a id="cdk-serverless-php-mpa-databaseprops"></a>


Construct properties for the Aurora Serverless MySQL compatible database cluster.



Name | Type | Description 
-----|------|-------------
**name**🔹 | <code>string</code> | Name of an initial database which is automatically created inside the cluster.
**network**🔹 | <code>[Network](#cdk-serverless-php-mpa-network)</code> | A "Network" resource is required to use the "Database" resource, and it should be passed in here.
**scaling**?🔹 | <code>[ServerlessScalingOptions](#aws-cdk-aws-rds-serverlessscalingoptions)</code> | Scaling configuration for the Aurora Serverless database cluster.<br/>__*Default*__: minCapacity: rds.AuroraCapacityUnit.ACU_2 maxCapacity: rds.AuroraCapacityUnit.ACU_16 autoPause: cdk.Duration.minutes(5)



## struct DomainProps 🔹 <a id="cdk-serverless-php-mpa-domainprops"></a>


Construct properties for the custom domain configuration of the PHP multi-page app.



Name | Type | Description 
-----|------|-------------
**name**🔹 | <code>string</code> | The custom domain name to be used to access the hosted PHP multi-page app.
**acmCertificate**?🔹 | <code>[ICertificate](#aws-cdk-aws-certificatemanager-icertificate)</code> | If your domain's DNS is managed outside of Route53, you've decided not to provide the "hostedZone" or you simply want to provide your own TLS/SSL certificate you can import it to ACM manually and pass it in here.<br/>__*Optional*__
**hostedZone**?🔹 | <code>[IHostedZone](#aws-cdk-aws-route53-ihostedzone)</code> | The Route53 hosted zone that responds to requests for this domain.<br/>__*Optional*__



## struct FilesystemProps 🔹 <a id="cdk-serverless-php-mpa-filesystemprops"></a>


Construct properties for the EFS (NFS) filesystem for local storage persistence within the Lambda function.



Name | Type | Description 
-----|------|-------------
**network**🔹 | <code>[Network](#cdk-serverless-php-mpa-network)</code> | A "Network" resource is required to use the "Filesystem" resource, and it should be passed in here.



## struct Waf 🔹 <a id="cdk-serverless-php-mpa-waf"></a>


Construct properties for the Web Application Firewall (AWS WAF).



Name | Type | Description 
-----|------|-------------
**allowListIpsV4**?🔹 | <code>Array<string></code> | List of CIDR notated IPv4 addresses allowed access to the application, all other requests will be blocked by AWS WAF.<br/>__*Optional*__
**allowListIpsV6**?🔹 | <code>Array<string></code> | List of IPv6 addresses allowed access to the application, all other requests will be blocked by AWS WAF.<br/>__*Optional*__
**rateLimit**?🔹 | <code>number</code> | Rate limit for requests to the application from a single IP over a 5 minute period.<br/>__*Optional*__



