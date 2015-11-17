
var AWS = require('aws-sdk');
var CfnLambda = require('cfn-lambda');

var APIG = new AWS.APIGateway({apiVersion: '2015-07-09'});

var Upsert = CfnLambda.SDKAlias({
  api: APIG,
  method: 'putMethod',
  downcase: true,
  forceBools: [
    'ApiKeyRequired',
    'RequestParameters.*'
  ],
  returnPhysicalId: function(data) {
    return [data.restApiId, data.resourceId, data.httpMethod].join(':');
  }
});

var Delete = CfnLambda.SDKAlias({
  api: APIG,
  method: 'deleteMethod',
  keys: ['HttpMethod', 'ResourceId', 'RestApiId'],
  downcase: true,
  ignoreErrorCodes: [404]
});

exports.handler = CfnLambda({
  Create: Upsert,
  Update: Upsert,
  Delete: Delete,
  SchemaPath: [__dirname, 'schema.json']
});
