(function(window) {


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

	// 手势密码构造函数
	window.GesturePwd = function(obj) {
		obj = obj || {};
		this.lowestCount = obj.lowestCount ? obj.lowestCount : 5; // 密码最少个数,默认为5
		this.colNum = obj.colNum ? obj.colNum : 3; // 每行多少个圈，默认为3个
		this.insertWrapId = obj.insertWrapId; // 生成的手势解锁的父DOM节点的id
		this.touchFlag = false; // 点击标志
	}

	GesturePwd.prototype = {
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
		// 初始化canvas、title和一个带有重置功能的div，只是插入了DOM节点
		createDOM: function(){
			var wrap = document.getElementById(this.insertWrapId);
			var str = `  
            	<canvas id="canvas" width="300" height="300"></canvas>
            		<div id="title" class="title"></div>
            	<div id="reset">重置密码</div>                
        	`;
			wrap.innerHTML = str;			
		},

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


		// 根据输入的每行个数来绘制整个canvas的密码圆圈
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
				console.log(4);
				e.preventDefault();
				self.resetPwd();
			}, false);
		},	
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
			this.drawLine(point); // 每帧画圆心
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
		// 获得当前的鼠标坐标相对于canvas的坐标值
		getCurrPosition: function(e) {
			rect = e.currentTarget.getBoundingClientRect();
			var point = {
				x: e.touches[0].clientX - rect.left,
				y: e.touches[0].clientY - rect.top
			}
			return point;
		},

		// 画小点
		drawPoint: function() {
			for (var i = 0; i < this.lastCircles.length; i++) {
				this.lastCircles[i].drawPoint(this.ctx);
			}
		},		
		// 渲染选中数组的连线
		drawLine: function(point) {
			this.ctx.beginPath();			
			this.ctx.lineWidth = 3;
			this.ctx.moveTo(this.lastCircles[0].x, this.lastCircles[0].y);
			//console.log(this.lastCircles.length);
			for (var i = 1; i < this.lastCircles.length; i++) {
				this.ctx.lineTo(this.lastCircles[i].x, this.lastCircles[i].y);
			}
			this.ctx.lineTo(point.x, point.y);
			this.ctx.stroke();
			this.ctx.closePath();
		},	
		// 根据传入的颜色不同，渲染不同的状态
		drawStatusPoint: function(color) {
			for (var i = 0; i < this.lastCircles.length; i++) {
				this.lastCircles[i].draw(this.ctx, color);
				this.lastCircles[i].drawPoint(this.ctx, color);
			}
		},			
		// 判断两个数组是否相等，用来验证密码
		equal: function(arr1, arr2){
			return arr1.sort().join() === arr2.sort().join();
		},

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
		
		// 点击重置密码后将currState设为0，密码清空，重新渲染canvas
		resetPwd: function() {
			window.localStorage.removeItem("pwd");
			this.currState = 0;
			this.pwd = [];
			this.switchState();
			this.initCircle();
		},
		
		// 初始化事件，分成两个子函数，一个渲染UI，一个绑定事件
		init: function() {
			// 初始化canvas、title和一个重置button,绘制整个初始界面
			this.initUI();

			// 绑定事件
			this.bindEvent();
		}
	}
})(window);