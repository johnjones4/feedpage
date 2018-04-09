build:
	docker build -t feedpage .
	docker tag feedpage johnjones4/feedpage
	docker push johnjones4/feedpage
