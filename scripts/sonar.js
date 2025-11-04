const scanner = require('sonarqube-scanner');

scanner(
  {
    serverUrl: 'https://sonarcloud.io',
    token: process.env.SONAR_TOKEN, // set in CircleCI - Project - Environment Variables
  },
  () => process.exit()
);
