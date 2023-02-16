PROJECT=$(shell basename $(shell pwd))
TAG=ghcr.io/johnjones4/${PROJECT}
VERSION=$(shell date +%s)

info:
	echo ${PROJECT} ${VERSION}

container:
	docker build -t ${TAG} ./
	docker push ${TAG}:latest
	docker image rm ${TAG}:latest

ci: container
