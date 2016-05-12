#!/bin/sh

set -e
set -u
set -x

npm install
bower install
grunt build-client

mkdir -p pkgs
tar -czvf pkgs/eyeosBusClientArtifact.tar.gz ./build/ bower.json
