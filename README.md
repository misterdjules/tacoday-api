# tacoday-api

tacoday-api is a toy project to experiment with various technologies related
to using containers for deploying software, such as Docker, Triton and
HashiCorp Vault.

It is a simplistic REST API server written in Node.js. It has a single
endpoint, `GET /wotd`, that connects to the Facebook API to determine what the
"word of the day" to get special deals at [La
Taqueria](facebook.com/LaTaqueria), a tacos restaurant in Vancouver.

## Running a tacoday-api server

### Comment settings

Regardless of how you choose to run it, tacoday-api requires a Facebook API
token to connect to Facebook's API. An [App Access
token](https://developers.facebook.com/docs/facebook-login/access-
tokens/#apptokens) is probably the most convenient token to us in this case.
This token can be set by setting the `FB_APP_TOKEN` environment variable when
running the server.

tacoday-api also requires the `FB_APP_TARGET_PAGE` environment variable to be
set. It identifies which Facebook page from which to get the posts that
contain the relevant information. Most of the time, it is set to `LaTaqueria`,
which is the name of the page for the tacos joint in Vancouver mentioned
earlier, but it can be set to any other page for testing or other purposes.

### Standalone

```
FB_APP_TARGET_PAGE=LaTaqueria FB_APP_TOKEN='your_fb_api_app_access_token' node index.js | bunyan
```

Using `bunyan` is not mandatory, but it pretty-prints log messages.

### Using Docker

To run the tacoday-api server using Docker, you'll first need to build the image of the container:
```
docker build -t your_docker_hub_username/name .
```
then publish the image on the Docker hub:
```
docker push your_docker_hub_username/name
```
and finally run a container using that image:
```
docker run --restart=always --name tacoday-api -P -d -e "FB_APP_TOKEN=your_fb_api_app_access_token" -e FB_APP_TARGET_PAGE=LaTaqueria your_docker_hub_username/tacoday-api
```

### Using docker-compose

It is also possible to run this container, along with the associated Slack bot
that can be used to query the API from a Slack channel by using [the tacobot
repository](https://github.com/misterdjules/tacobot). That repository contains
a `docker-compose` configuration file that can be used to create and run both
the tacoday-api server and the associated [taco Slack
bot](https://github.com/misterdjules/taco-slackbot).
