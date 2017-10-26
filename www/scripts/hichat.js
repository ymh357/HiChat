window.onload=function () {
    let hiChat=new HiChat()
    hiChat.init()
}

function HiChat(){
    this.socket=null
}

HiChat.prototype= {
    init() {
        let that = this
        this.socket = io.connect()
        this.socket.on('connect', function () {
            that._initialEmoji()
            document.getElementById('info').textContent = 'get yourself a nickname :)'
            document.getElementById('nickWrapper').style.display = 'block'
            document.getElementById('nicknameInput').focus()
            document.getElementById('loginBtn').addEventListener('click',function () {
                let nickname=document.getElementById('nicknameInput').value
                if(nickname && nickname.trim().length!==0){
                    that.socket.emit('login',nickname)
                }else{
                    document.getElementById('nicknameInput').focus()
                }
            },false)
            document.getElementById('nicknameInput').addEventListener('keyup',function (e) {
                if(e.keyCode===13){
                    document.getElementById('loginBtn').click()
                }
            })
        })
        this.socket.on('nickExisted',function () {
            document.getElementById('info').textContent = '!nickname is taken, choose another pls'
        })
        this.socket.on('loginSuccess',function () {
            document.title='hichat | '+document.getElementById('nicknameInput').value
            document.getElementById('loginWrapper').style.display='none'
            document.getElementById('messageInput').focus()
        })
        this.socket.on('system',function (nickName,userCount,type) {
            let msg=nickName+ (type==='login'?' joined':' left')
            that._displayNewMsg('system',msg,'red')
            document.getElementById('status').textContent=userCount+(userCount>1?' users ': ' user ')+'online'
        })
        this.socket.on('newMsg',function (user,msg,color) {
            that._displayNewMsg(user,msg,color)
        })
        this.socket.on('newImg',function (user,imgData,color) {
            that._displayImg(user,imgData,color)
        })

        document.getElementById('sendBtn').addEventListener('click',function () {
            let messageInput=document.getElementById('messageInput'),
                msg=messageInput.value,
                color=document.getElementById('colorStyle').value
            messageInput.value=''
            messageInput.focus()
            if(msg.trim().length!==0){
                that.socket.emit('postMsg',msg,color)
                that._displayNewMsg('me',msg,color)
            }
        })
        document.getElementById('messageInput').addEventListener('keyup',function (e) {
            if(e.keyCode===13){
                document.getElementById('sendBtn').click()
            }
        })
        document.getElementById('sendImage').addEventListener('change',function () {
            let thatDom=this,
                color=document.getElementById('colorStyle').value
            if(this.files.length!==0){
                let file=this.files[0],
                    reader=new FileReader()
                if(!reader){
                    that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
                    this.value=''
                    return
                }
                reader.onload=function (e) {
                    thatDom.value=''
                    that.socket.emit('img',e.target.result,color)
                    that._displayImg('me',e.target.result,color)
                }
                reader.readAsDataURL(file)
            }
        },false)
        document.getElementById('emoji').addEventListener('click',function (e) {
            let emojiWrapper=document.getElementById('emojiWrapper')
            emojiWrapper.style.display='block'
            e.stopPropagation()
        },false)
        document.getElementById('emojiWrapper').addEventListener('click',function (e) {
            let target=e.target
            if(target.nodeName.toLowerCase()==='img'){
                let messageInput=document.getElementById('messageInput')
                messageInput.focus()
                messageInput.value=messageInput.value+'[emoji:'+target.title+']'
            }
        },false)
        document.body.addEventListener('click',function (e) {
            let emojiWrapper=document.getElementById('emojiWrapper')
            if(e.target !== emojiWrapper){
                emojiWrapper.style.display='none'
            }
        })
    },
    _displayNewMsg: function (user,msg,color) {
        let container=document.getElementById('historyMsg'),
            msgToDisplay=document.createElement('p'),
            date=new Date().toTimeString().substr(0,8)

        msg=this._showEmoji(msg)
        msgToDisplay.style.color=color||'#000'
        msgToDisplay.innerHTML=user + '<span class="timespan">('+date+'):</span>' + msg
        container.appendChild(msgToDisplay)
        container.scrollTop=container.scrollHeight
    },
    _displayImg(user,imgData,color) {
        let container=document.getElementById('historyMsg'),
            msgToDisplay=document.createElement('p'),
            date=new Date().toDateString().substr(0,8)
        msgToDisplay.style.color=color || '#000'
        msgToDisplay.innerHTML=user+'<span class="timespan">('+date+')</span><br/><a href="'+imgData+'" target="_blank"><img src="'+imgData+'"></a>'
        container.appendChild(msgToDisplay)
        container.scrolltop=container.scrollHeight
    },
    _initialEmoji(){
        let emojiContainer=document.getElementById('emojiWrapper'),
            docFragment=document.createDocumentFragment()
        for(let i=69;i>0;i--){
            let emojiItem=document.createElement('img')
            emojiItem.src='../content/emoji/'+i+'.gif'
            emojiItem.title=i
            docFragment.appendChild(emojiItem)
        }
        emojiContainer.appendChild(docFragment)
    },
    _showEmoji(msg){
        let reg=/\[emoji:\d+\]/g,
            match,
            result=msg,
            emojiIndex,
            totalEmojiNum=document.getElementById('emojiWrapper').children.length
        while(match=reg.exec(msg)){
            emojiIndex=match[0].slice(7,-1)
            if(emojiIndex>totalEmojiNum){
                result=result.replace(match[0],'[X]')
            }else{
                result=result.replace(match[0],'<img class="emoji" src="../content/emoji/'+emojiIndex+'.gif" />')
            }
        }
        return result
    }
}