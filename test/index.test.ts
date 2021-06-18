import * as cdk from '@aws-cdk/core';
import { Code, Network, Database, Filesystem, Domain, Cdn } from '../src/index';
import '@aws-cdk/assert/jest';

test('Lambda + HTTP API', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  new Code(stack, 'PhpMpaLambdaApi', {
    src: 'test/sample-php-app-src/',
    buildWrapper: false,
  });
  expect(stack).toHaveResource('AWS::Lambda::Function');
  expect(stack).toHaveResource('AWS::ApiGatewayV2::Api');
});

test('Lambda + HTTP API + RDS', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  const network = new Network(stack, 'PhpMpaVpc');
  const database = new Database(stack, 'PhpMpaDatabase', {
    network: network,
    name: 'TestDB',
  });
  new Code(stack, 'PhpMpaLambdaApi', {
    src: 'test/sample-php-app-src/',
    network,
    database,
    buildWrapper: false,
  });
  expect(stack).toHaveResource('AWS::Lambda::Function');
  expect(stack).toHaveResource('AWS::ApiGatewayV2::Api');
  expect(stack).toHaveResource('AWS::EC2::VPC');
  expect(stack).toHaveResource('AWS::EC2::VPCEndpoint');
  expect(stack).toHaveResource('AWS::EC2::SecurityGroup');
  expect(stack).toHaveResource('AWS::SecretsManager::Secret');
  expect(stack).toHaveResource('AWS::RDS::DBCluster');
});

test('Lambda + HTTP API + RDS + EFS', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  const network = new Network(stack, 'PhpMpaVpc');
  const database = new Database(stack, 'PhpMpaDatabase', {
    network: network,
    name: 'TestDB',
  });
  const filesystem = new Filesystem(stack, 'PhpMpaFilesystem', {
    network: network,
  });
  new Code(stack, 'PhpMpaLambdaApi', {
    src: 'test/sample-php-app-src/',
    network,
    database,
    filesystem,
    buildWrapper: false,
  });
  expect(stack).toHaveResource('AWS::Lambda::Function');
  expect(stack).toHaveResource('AWS::ApiGatewayV2::Api');
  expect(stack).toHaveResource('AWS::EC2::VPC');
  expect(stack).toHaveResource('AWS::EC2::VPCEndpoint');
  expect(stack).toHaveResource('AWS::EC2::SecurityGroup');
  expect(stack).toHaveResource('AWS::SecretsManager::Secret');
  expect(stack).toHaveResource('AWS::RDS::DBCluster');
  expect(stack).toHaveResource('AWS::EFS::FileSystem');
  expect(stack).toHaveResource('AWS::EFS::MountTarget');
});

test('Lambda + HTTP API + RDS + EFS + Domain', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  const network = new Network(stack, 'PhpMpaVpc');
  const database = new Database(stack, 'PhpMpaDatabase', {
    network: network,
    name: 'TestDB',
  });
  const filesystem = new Filesystem(stack, 'PhpMpaFilesystem', {
    network: network,
  });
  const domain = new Domain(stack, 'PhpMpaDomain', {
    name: 'example.com',
  });
  new Code(stack, 'PhpMpaLambdaApi', {
    src: 'test/sample-php-app-src/',
    network,
    database,
    filesystem,
    domain,
    buildWrapper: false,
  });
  expect(stack).toHaveResource('AWS::Lambda::Function');
  expect(stack).toHaveResource('AWS::ApiGatewayV2::Api');
  expect(stack).toHaveResource('AWS::EC2::VPC');
  expect(stack).toHaveResource('AWS::EC2::VPCEndpoint');
  expect(stack).toHaveResource('AWS::EC2::SecurityGroup');
  expect(stack).toHaveResource('AWS::SecretsManager::Secret');
  expect(stack).toHaveResource('AWS::RDS::DBCluster');
  expect(stack).toHaveResource('AWS::EFS::FileSystem');
  expect(stack).toHaveResource('AWS::EFS::MountTarget');
  expect(stack).toHaveResource('AWS::ApiGatewayV2::DomainName');
});

test('Lambda + HTTP API + RDS + EFS + CDN + WAF + Domain', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  const network = new Network(stack, 'PhpMpaVpc');
  const database = new Database(stack, 'PhpMpaDatabase', {
    network: network,
    name: 'TestDB',
  });
  const filesystem = new Filesystem(stack, 'PhpMpaFilesystem', {
    network: network,
  });
  const domain = new Domain(stack, 'PhpMpaDomain', {
    name: 'example.com',
  });
  const code = new Code(stack, 'PhpMpaLambdaApi', {
    src: 'test/sample-php-app-src/',
    network,
    database,
    filesystem,
    buildWrapper: false,
  });
  new Cdn(stack, 'PhpMpaCdn', {
    code,
    domain,
    waf: {
      allowListIpsV4: [
        '192.0.2.0/32',
      ],
      allowListIpsV6: [
        '2001:db8::/128',
      ],
      rateLimit: 100,
    },
  });
  expect(stack).toHaveResource('AWS::Lambda::Function');
  expect(stack).toHaveResource('AWS::ApiGatewayV2::Api');
  expect(stack).toHaveResource('AWS::EC2::VPC');
  expect(stack).toHaveResource('AWS::EC2::VPCEndpoint');
  expect(stack).toHaveResource('AWS::EC2::SecurityGroup');
  expect(stack).toHaveResource('AWS::SecretsManager::Secret');
  expect(stack).toHaveResource('AWS::RDS::DBCluster');
  expect(stack).toHaveResource('AWS::EFS::FileSystem');
  expect(stack).toHaveResource('AWS::EFS::MountTarget');
  expect(stack).toHaveResource('AWS::WAFv2::IPSet');
  expect(stack).toHaveResource('AWS::WAFv2::WebACL');
  expect(stack).toHaveResource('AWS::S3::Bucket');
  expect(stack).toHaveResource('Custom::CDKBucketDeployment');
  expect(stack).toHaveResource('AWS::CloudFront::CachePolicy');
  expect(stack).toHaveResource('AWS::CloudFront::OriginRequestPolicy');
  expect(stack).toHaveResource('AWS::CloudFront::Distribution');
});