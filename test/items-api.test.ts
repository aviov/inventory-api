import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as InventoryApi from '../lib/inventory-api-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new InventoryApi.InventoryApiStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(stack);
    // This is generic unrelated test example for testing one of AWS individual resources within the stack:
    template.hasResourceProperties('AWS::SQS::Queue', {
      VisibilityTimeout: 300
    });
    // expectCDK(stack).to(matchTemplate({
    //   "Resources": {}
    // }, MatchStyle.EXACT))
});
