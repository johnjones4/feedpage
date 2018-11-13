build:
	docker build -t feedpage .
	docker tag feedpage johnjones4/feedpage
	docker push johnjones4/feedpage

install:
	cd server && npm install
	cd client && npm install

run-server:
	cd server && nodemon index.js

run-client:
	cd client && npm start