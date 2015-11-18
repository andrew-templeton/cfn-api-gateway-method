
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
  returnPhysicalId: function(data, params) {
    return [params.RestApiId, params.ResourceId, params.HttpMethod].join(':');
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
  Create: function(params, reply) {
    var methodSignature = {
      httpMethod: params.HttpMethod,
      resourceId: params.ResourceId,
      restApiId: params.RestApiId
    };
    Upsert(params, function(createError, physicalId) {
      if (createError) {
        console.log('Create call threw and exception: %s', createError);
        return reply(createError);
      }
      wait();
      function wait() {
        APIG.getMethod(methodSignature, function(err, data) {
          if (err && err.statusCode === 404) {
            return wait();
          }
          if (err) {
            return reply('Error while waiting for creation to complete!');
          }
          return reply(null, physicalId);
        });
      }
    });
  },
  Update: Upsert,
  Delete: Delete,
  SchemaPath: [__dirname, 'schema.json']
});
