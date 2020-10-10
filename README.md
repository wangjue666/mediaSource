# mediaSource
 mediaSource视频点播服务
 
### 1.下载安装mp4box 

https://gpac.wp.imt.fr/downloads/
 
### 2.解析MP4格式的视频

运行指令 mp4box -dash 毫秒(切段的大小 example: 60000) -frag 毫秒(fragment大小 example: 60000) -rap(可选；首帧视频变大 大约普通段的三倍) 视频(example:a.mp4)；
执行完会生成一个 name.mpd文件和 name_dashinit.mp4的文件

### 3.cnpm install & cd server & node server.js
