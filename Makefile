PROJECT=$(shell basename $(shell pwd) | awk '{print tolower($0)}')
TAG=ghcr.io/johnjones4/${PROJECT}

info:
	echo ${PROJECT}

ci:
	docker build -t ${TAG} ./server
	docker push ${TAG}:latest
	docker image rm ${TAG}:latest
