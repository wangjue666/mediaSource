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
       }, reject)
    })
   
}

router.get("/meta/:name",async ctx=>{
    const {name} = ctx.params
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
    
   
    ctx.body = {
        duration: Math.floor(duration),mimeType, codecs, width, height, segmentSize,
        segments
    }
})


app.use(router.routes())

app.use(static("./static"))

app.listen(9096)

console.info("running on 9096")
