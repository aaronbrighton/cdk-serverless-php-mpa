const { AwsCdkConstructLibrary } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'Aaron Brighton',
  authorAddress: 'aaron@aaronbrighton.ca',
  cdkVersion: '1.95.2',
  defaultReleaseBranch: 'main',
  description: 'A JSII construct lib to build AWS Serverless LAMP stacks with AWS CDK that support traditional multi-page applications.',
  name: 'cdk-serverless-php-mpa',
  repositoryUrl: 'https://github.com/aaronbrighton/cdk-serverless-php-mpa-test.git',
  stability: 'experimental',

  // cdkDependencies: undefined,        /* Which AWS CDK modules (those that start with "@aws-cdk/") does this library require when consumed? */
  // cdkTestDependencies: undefined,    /* AWS CDK modules required for testing. */
  // deps: [],                          /* Runtime dependencies of this module. */
  // devDeps: [],                       /* Build dependencies for this module. */
  // packageName: undefined,            /* The "name" in package.json. */
  // projectType: ProjectType.UNKNOWN,  /* Which type of project this is (library/app). */
  // release: undefined,                /* Add release management to this project. */
});
project.synth();