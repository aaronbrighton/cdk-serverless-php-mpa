const { AwsCdkConstructLibrary } = require('projen');
const { ProjectType } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'Aaron Brighton',
  authorAddress: 'aaron@aaronbrighton.ca',
  cdkVersion: '1.95.2',
  defaultReleaseBranch: 'main',
  description: 'A JSII construct lib to build AWS Serverless LAMP stacks with AWS CDK that support traditional multi-page applications.',
  name: 'cdk-serverless-php-mpa',
  repositoryUrl: 'https://github.com/aaronbrighton/cdk-serverless-php-mpa.git',
  stability: 'experimental',
  keywords: [
    'aws',
    'serverless',
    'lamp',
    'mpa',
    'php',
    'hosting',
  ],
  projectType: ProjectType.LIB,
  releaseToNpm: true,
  projenUpgradeAutoMerge: true,
  cdkDependencies: [
    '@aws-cdk/aws-apigatewayv2',
    '@aws-cdk/aws-apigatewayv2-integrations',
    '@aws-cdk/aws-cloudfront',
    '@aws-cdk/aws-cloudfront-origins',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-efs',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-rds',
    '@aws-cdk/aws-s3',
    '@aws-cdk/aws-s3-deployment',
    '@aws-cdk/aws-wafv2',
    '@aws-cdk/aws-route53',
    '@aws-cdk/aws-route53-targets',
    '@aws-cdk/aws-certificatemanager',
    '@aws-cdk/core',
  ],
});
const common_exclude = ['cdk.out', 'yarn-error.log'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);
project.tasks.tryFind('package').prependExec('cp -r src/cdk-serverless-php-mpa-utils lib/');
project.synth();