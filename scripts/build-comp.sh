#! /usr/bin/bash

# finding all file under `packages/components`
# piping to rollup to config.
echo "build components"
find packages/components -type f -name '*.vue' -print0 | \
xargs -P4 -0 -I {} node configs/rollup.comp.js {}
# find   path   -option   [   -print ]   [ -exec   -ok   command ]   {} \;
# -type c : 文件类型是 c 的文件。
# f 一般文件
# print 和 - print0的区别-print 在每一个输出后会添加一个回车换行符，而-print0则不会
# xargs是给命令传递参数的一个过滤器，也是组合多个命令的一个工具。它把一个数据流分割为一些足够小的块，以方便过滤器和命令进行处理。
# -I指定每一项命令行参数的替代字符串。
# xargs命令的-0参数表示用null当作分隔符

yarn build:entry
# after components build finished, build icon.ts as well.
echo "generate type files"
yarn gen-dts
