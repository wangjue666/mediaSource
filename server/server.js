const Koa = require("koa")
const Router = require("koa-router")
const static = require("koa-static")
const xml2js = require("xml2js")
const fs = require("promise-fs")
const path = require("path")
const assert = require("assert")
let app = new Koa()

let router = new Router()

function readXml(path){
    return new Promise((resolve, reject)=>{
       fs.readFile(path).then(buffer=>{
          xml2js.parseString(buffer.toString(), (err, xml)=>{
              if(err){
                  reject(err)
              }else{
                  resolve(xml)
              }
          })  
       }).catch(e=>reject(e))
    })
   
}
const _cache = {}
async function readMPD(name){
    if(_cache[name]){
        return _cache[name]
    }
    let file = path.resolve("videos/", name+'_dash.mpd')
    let xml = await readXml(file)
   
    let duration = 0

    let arr = xml.MPD.$.mediaPresentationDuration.match(/\d+(\.\d+)?[A-Z]/g)
    arr.forEach(s=>{
        if(s.endsWith("H")){
            duration+=parseFloat(s)*3600
        }else if(s.endsWith("M")){
            duration+=parseFloat(s)*60
        }else if(s.endsWith("S")){
            duration+=parseFloat(s)
        }else{
            assert(false, "unknow time" + s)
        }
    })

    let {mimeType, codecs, width, height} = xml.MPD.Period[0].AdaptationSet[0].Representation[0].$
    let List = xml.MPD.Period[0].AdaptationSet[0].Representation[0].SegmentList[0]
    let segmentSize = List.$.duration
    let segments = [
        List.Initialization[0].$.range,
        ...List.SegmentURL.map(segment=>segment.$.mediaRange)
    ].map(item=>item.split("-").map(Number))
    
   
    _cache[name] = {
        duration: Math.floor(duration),mimeType, codecs, width, height, segmentSize,
        segments
    }
    return _cache[name]
}
async function read(file, start, end){
    let buffer = Buffer.alloc(end - start)
    let fd = await fs.open(file, 'r')
    let res = await fs.read(fd, buffer, 0, end-start, start)
    assert(res == end-start, "unexcepted")
    await fs.close(fd)
    return buffer
}

router.get("/meta/:name",async ctx=>{
    const {name} = ctx.params
    let mpd = await readMPD(name)
    let {duration,mimeType, codecs, width, height, segmentSize} = mpd
    ctx.body = {duration,mimeType, codecs, width, height, segmentSize}
})

router.get("/video/:name/:block", async ctx=>{
    const {name, block} = ctx.params
    let mpd = await readMPD(name)
    const [start, end] = mpd.segments[block]
    let buffer = await read(path.resolve("videos/", `${name}_dashinit.mp4`), start, end)
   
    ctx.set("content-type", mpd.mimeType)
    ctx.set("content-length", buffer.length)
    ctx.body = buffer
})


app.use(router.routes())

app.use(static("./static"))

app.listen(9096)

console.info("running on 9096")
