#! /usr/bin/bash

# Do not run this file without setting the environment variables, you will end up fatal error
# If you wish to run this locally, please change the env variable before running this.
# do clean job before build started
rm -rf build
# build full bundle.
node configs/rollup.js
# build individual component
# sh执行命令从标准输入读取或从一个文件中读取
sh scripts/build-comp.sh
# rule out version field from `package.json`
# replace with `env.TAG_VERSION` from Github Action
# cat（英文全拼：concatenate）命令用于连接文件并打印到标准输出设备上
cat package.json | grep -v '"version":' | sed "s/\(\"name\": \"@element-plus\/icons\"\)/\1,\n  \"version\": \"${TAG_VERSION}\"/g" > build/package.json
# Publish
npm publish "./build" --registry ${REGISTRY}