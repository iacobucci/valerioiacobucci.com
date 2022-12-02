#!/bin/sh

(cd nginx && ./build.sh)
(cd backend && ./build.sh)
(cd frontend && ./build.sh)
