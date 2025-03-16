#!/bin/bash

# 设置工作目录和程序名
WORKSPACE=/Users/melonkid/Workspace/myself
PROGRAM_NAME="melon-blog"

scp -r $WORKSPACE/$PROGRAM_NAME/public/* melonkid@49.232.131.132:~/$PROGRAM_NAME



