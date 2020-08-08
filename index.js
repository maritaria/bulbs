import MagicHome from 'magic-home';
import Koa from 'koa';
import Router from 'koa-router';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';

const router = new Router();

router.get('/lamps', async (ctx, next) => {
	const discovery = new MagicHome.Discovery();
	const devices = await discovery.scan(500);
	ctx.body = devices;
});

router.get('/lamps/:ip', async (ctx, next) => {
	const ip = ctx.params.ip;
	const device = new MagicHome.Control(ip);
	const state = await device.queryState();
	ctx.body = state;
});

router.post('/lamps/:ip/power', async (ctx, next) => {
	const ip = ctx.params.ip;
	const device = new MagicHome.Control(ip);
	const input = ctx.request.body;
	const success = await device.setPower(!!input.power);
	ctx.body = { success };
});

router.post('/lamps/:ip/color', async (ctx, next) => {
	const ip = ctx.params.ip;
	const device = new MagicHome.Control(ip);
	const input = ctx.request.body;
	const success = await device.setColor(input.red, input.green, input.blue);
	ctx.body = { success };
});

const app = new Koa();

// ensureAcceptsJson
app.use(async (ctx, next) => {
	ctx.assert(ctx.request.accepts('json'), 406);
	await next();
});

app.use(json());
app.use(bodyParser());

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(8080);
