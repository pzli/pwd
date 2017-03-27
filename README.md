## 手势密码

利用原生JavaScript实现了手势密码组件。

引入js和css后，可以通过new GesturePwd(obj).init()实现一个手势密码功能，通过obj传入参数

obj = {
	lowestCount: 5, // 密码最少个数,默认为5，可选
	colNum: 3, // 每行多少个圈，默认为3个，可选
	insertWrapId: "wrap" // 生成的手势解锁的父DOM节点的id，必须传入
}

整体UI渲染利用了canvas来实现，事件通过DOM绑定实现。


HTML部分结构：

	<canvas id="canvas" width="300" height="300"></canvas>
	<div id="title" class="title"></div>
	<div id="reset">重置密码</div> 

canvas实现手势密码，title实现提示，reset实现密码重置。



JS部分：

利用到了两个对象，一个Circle，一个GesturePwd。

Circle是辅助对象，代表每个密码圆。

原型对象上有三个方法，draw是用来渲染每个密码圆，如下图

![](http://i4.buimg.com/567571/7322b9627dd073ac.png)

drawPoint是用来渲染每个密码圆被选中时的中心小圆，如下图绿色部分

![](http://i4.buimg.com/567571/e5a9cd16e6daa820.png)

contain是用来判断当前鼠标坐标是否在当前圆内

	// 辅助对象，代表每个密码圆
	function Circle(x, y, r, key) {
		// 圆的圆心坐标
		this.x = x;
		this.y = y;
		// 圆的半径
		this.r = r;
		// 该圆代表的密码值
		this.key = key;
	}

	Circle.prototype = {
			// 渲染密码点圆圈
			draw: function(ctx, color) {
				//console.log(123);
				color = color || "#222";
				ctx.strokeStyle = color; // 密码圆环的颜色	
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, true);
				ctx.closePath();
				ctx.stroke();
			},
			// 渲染连线时位于密码圆上的小圆点
			drawPoint: function(ctx, color) {
				color = color || "green";
				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r / 2, 0, 2 * Math.PI, true);
				ctx.closePath();
				ctx.fill();
			},

			//判断当前鼠标坐标是否在当前圆内
			contain: function(x, y) {
				return Math.abs(x - this.x) < this.r && Math.abs(y - this.y) < this.r;
			}
		}


GesturePwd是主体组件，在init方法中将渲染UI和事件绑定分开。

		// 初始化事件，分成两个子函数，一个渲染UI，一个绑定事件
		init: function() {
			// 初始化canvas、title和一个重置button,绘制整个初始界面
			this.initUI();

			// 绑定事件
			this.bindEvent();
		}
		
		
在initUI方法中

	initUI: function() {
			// 创建DOM节点
			this.createDOM();
			// 从localStorage中取得缓存，设置当前状态为2，如果不存在生成一个新对象，设置当前状态为0
			this.getLocalStorage();
			this.switchState();

			// 获取canvas值和上下文对象
			this.canvas = document.getElementById("canvas");
			this.ctx = this.canvas.getContext("2d");
			// 获取ctx值之后渲染canvas画板
			this.initCircle();			
		},
		
先通过innerHTML，向父组件插入生成好的HTML节点。

然后从localStorage取得密码缓存，设置当前状态currState=2，不存在则生成新对象，currState=0。

	// 如果从localStorage中取得缓存，那么设置当前状态为2，如果不存在生成一个新对象，设置当前状态为0
		getLocalStorage: function() {
			if (window.localStorage.getItem("pwd")) {
				this.pwd = JSON.parse(window.localStorage.getItem("pwd"));
				this.currState = 2;
			} else {
				this.pwd = [];
				this.currState = 0;
			}
		},

根据上个方法获得的currState来设置整个组件的状态。

	// 根据当前的currState设置title内容，分为0、1、2
		switchState: function() {
			if (this.currState == 2) {
				// 此时可以重置密码
				document.getElementById("reset").style.display = 'block';
				document.getElementById("title").innerHTML = '请解锁密码';
			} else if (this.currState == 1) {
				document.getElementById("reset").style.display = 'none';
				document.getElementById("title").innerHTML = '请再次输入密码';
			} else {
				document.getElementById("reset").style.display = 'none';
				document.getElementById("title").innerHTML = '请设置手势密码';
			}
		},


最后根据输入的每行个数来绘制整个canvas的密码圆圈。

在这个方法中，设置了三个数组，分别是circles、lastCircles和restCircles，所有数组保存的都是Circle对象。

circles是整个canvas中一个有多少个Circle对象，比如正常情况下的9个。

lashCircles代表的是当前滑动过程中选中的Circle对象。

restCircles代表的是还没有被选中的Circle对象，为了使已点击过的密码不再被选中。

	initCircle: function() {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
			this.circles = []; // 全部密码点
			this.lastCircles = []; // 已经选中了的密码点
			this.restCircles = []; // 还未点击的密码点，为了使已点击过的密码不再被选中	
			var n = this.colNum;
			//console.log(n);
			var r = this.ctx.canvas.width / (4 * n + 2); // 每行个数为n，空白个数n-1+2.总共2n+1，半径再除以2
			//console.log(r);
			var key = 1;
			for (var i = 0; i < n; i++) {
				for (var j = 0; j < n; j++) {
					var circle = new Circle(j * 4 * r + 3 * r, i * 4 * r + 3 * r, r, key);
					circle.draw(this.ctx);
					this.circles.push(circle);
					this.restCircles.push(circle);
					key++;
				}
			}
		},


整个UI渲染完后就为DOM节点添加事件监听

		// 绑定事件函数
		bindEvent: function() {
			var self = this;
			this.canvas.addEventListener("touchstart", function(e) {
				//console.log(1);
				self.touchStart(e);
				e.preventDefault();
			}, false);
			this.canvas.addEventListener("touchmove", function(e) {
				//console.log(2);
				e.preventDefault();
				self.touchMove(e);
			}, false);
			this.canvas.addEventListener("touchend", function(e) {
				//console.log(3);
				e.preventDefault();
				self.touchEnd(e);
			}, false);
			document.getElementById("reset").addEventListener("click", function(e) {
				//console.log(4);
				e.preventDefault();
				self.resetPwd();
			}, false);
		},	
		
当touchstart、touchmove、touchend时都会触发不同的事件，并且点击reset重置密码后，也会触发一个resetPwd事件。


当touchstart触发后，触发touchStart事件，获得当前鼠标坐标值，如果当前点击的在某个圆圈内，那么设置touchFlag为true，向lastCircles添加当前圆，并且触发drawPoint方法。

		// touch开始触发
		touchStart: function(e) {
			var point = this.getCurrPosition(e);
			//console.log(this.circles);
			for (var i = 0; i < this.circles.length; i++) {
				if (this.circles[i].contain(point.x, point.y)) {
					this.touchFlag = true;
					//console.log(this.touchFlag);
					this.lastCircles.push(this.circles[i]); // 向当前数组添加该密码点对应的数字密码
					this.restCircles.splice(i, 1);
					this.drawPoint();
				}
			}
		},	

当touchmove触发时，触发touchMove放啊，每次清除上次的canvas，重新绘制UI，否则会出现连线覆盖，持续判断当前是否经过一个新的密码圆，然后继续绘制UI。

		// touch滑动持续触发
		touchMove: function(e) {
			if (!this.touchFlag) return;

			// 每次都要重新调用重新绘制画板，否则会出现连线覆盖
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

			for (var i = 0; i < this.circles.length; i++) { 
				this.circles[i].draw(this.ctx);
			}
			var point = this.getCurrPosition(e);
			//console.log(2);

			// 这里顺序反了的话会出现闪烁效果
			this.drawLine(point); 
			this.drawPoint();

			for (var i = 0; i < this.restCircles.length; i++) {
				if (this.restCircles[i].contain(point.x, point.y)) {
					this.lastCircles.push(this.restCircles[i]);
					this.drawPoint();
					this.restCircles.splice(i, 1);
					break;
				}
			}
		},
		
当touchend发生后，首先会判断lastCircles中元素个数是否大于等于最小密码个数，如果符合条件就会对lastCircles中的数据进行判断、如果正确就会保存，调用storePwd方法，在半秒后重置UI。

		// 结束touch触发
		touchEnd: function(e) {
			if (!this.touchFlag) return;
			this.touchFlag = false;
			if (this.lastCircles.length < this.lowestCount && this.currState == 0) {
				//console.log(2);
				document.getElementById("title").innerHTML = "密码太短，至少需要" + this.lowestCount + "个点";
				this.drawStatusPoint('red');
				this.currState = 0;
			} else {
				this.storePwd(this.lastCircles);
			}
			var self = this;
			setTimeout(function() {
				self.switchState();
				self.initCircle();
			}, 500);
		},		
		
下面是storePwd的具体逻辑，根据当前currState的不同，分别判断逻辑。


		// 根据currState的不同来验证密码，并且保存密码
		storePwd: function(pwd) {
			pwd = pwd.map(function(item, index) {
				return item.key;
			});
			if (this.currState == 1) {
				if (this.equal(this.fpwd, pwd)) {
					this.currState = 2;
					this.pwd = pwd;
					document.getElementById("title").innerHTML = '密码设置成功';
					this.drawStatusPoint("green");
					window.localStorage.setItem('pwd', JSON.stringify(this.pwd));
				} else {
					document.getElementById("title").innerHTML = '两次输入的不一致';
					this.drawStatusPoint('red');
					this.currState = 0;
				}
			} else if (this.currState == 2) {
				if (this.equal(this.pwd, pwd)) {
					document.getElementById("title").innerHTML = '密码正确！';
					//这里可以发出异步调用ajax之类的完成登陆后的请求
					this.drawStatusPoint("green");
				} else {
					this.drawStatusPoint('red');
					document.getElementById("title").innerHTML = '输入的密码不正确';
				}
			} else {
				this.currState = 1;
				this.fpwd = pwd;
				document.getElementById("title").innerHTML = '请再次输入手势密码';
			}
		},
		
		
如果currState=2，那么reset的display为block，可以点击，触发resetPwd事件，点击重置密码后将currState设为0，密码清空，重新渲染canvas。

	// 点击重置密码后将currState设为0，密码清空，重新渲染canvas
		resetPwd: function() {
			window.localStorage.removeItem("pwd");
			this.currState = 0;
			this.pwd = [];
			this.switchState();
			this.initCircle();
		},
		
		
整个组件的设计逻辑大体就是上面所述，与给定的设计原形略微不同，是因为我认为给定的原形中有两个按钮，通过按钮来判断当前要执行的逻辑，如果在设置逻辑中输入一次密码后，用户突然点击验证密码，会出现问题。

所以我修改了这部分的逻辑，只设置一个reset按钮，只有当设置好密码后才会显示这个按钮，点击这个按钮会重置密码进入设置密码状态。

