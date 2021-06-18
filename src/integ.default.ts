import * as cdk from '@aws-cdk/core';
import { Code, Network, Database, Filesystem, Cdn } from './index';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'ServerlessPhpMpa');

const network = new Network(stack, 'PhpMpaNetwork');

const database = new Database(stack, 'PhpMpaDatabase', {
  network: network,
  name: 'PhpMpaDatabaseIntegTest',
});

const filesystem = new Filesystem(stack, 'PhpMpaFilesystem', {
  network: network,
});

const code = new Code(stack, 'PhpMpaCode', {
  src: 'test/sample-php-app-src/',
  database: database,
  network: network,
  filesystem,
});

const cdn = new Cdn(stack, 'PhpMpaCdn', {
  code,
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

new cdk.CfnOutput(stack, 'PhpMpaCdnEndpoint', {
  description: 'The URL for accessing your PHP multi-page app using the CDN.',
  value: cdn.distribution.domainName,
});