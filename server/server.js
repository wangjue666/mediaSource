const Koa = require("koa")
const Router = require("koa-router")
const static = require("koa-static")
const xml2js = require("xml2js")
const fs = require("promise-fs")
const path = require("path")
let app = new Koa()

let router = new Router()

router.get("/meta/:name",async ctx=>{
    const {name} = ctx.params.name
    let buffer = await fs.readFile(path.resolve("videos/", name+'_dash.mpd'))
    ctx.body = buffer.toString()
})


app.use(router.routes())

app.use(static("./static"))

app.listen(9096)

console.info("running on 9096")
