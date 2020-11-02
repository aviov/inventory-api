#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ItemsApiStack } from '../lib/items-api-stack';

const app = new cdk.App();
new ItemsApiStack(app, 'ItemsApiStack');
