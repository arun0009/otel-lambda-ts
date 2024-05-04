#!/bin/bash
awslocal dynamodb create-table \
    --table-name items \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,AttributeType=HASH \
    --provisioned-throughput ReadCapacityUnit=1,WriteCapacityUnit=1    
