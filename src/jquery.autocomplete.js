;
/**
* jQuery 自动补全插件
* author: GavinCook
* 功能特性：
* 1. 本地指定数据补全 (done)
* 2. 异步数据补全(json格式) (done)
* 3. 补全列表尺寸设置(高度、宽度) (not done)
* 4. 动态补全事件绑定(可为还不存在的元素绑定自动补全触发事件) (done)
* 5. 多触发方式(keydown,keyup,方向键) (done)
**/
(function($){
	var _defaults = {
		trigger : "keyup",//触发方式
		triggerLength: 1,//触发长度,只有当内容的长度达到设置才会触发自动补全
		data:[],//列表数据 : array , function , deferred , string(url)
		css:"_auto-complete",//css
		close:"blur",
		ajaxtype:"Get",
		ajaxParam:{},
		ajaxDataType:"json",
		customFormat:undefined
	}


	$.fn.autoComplete = function(opts){
		opts = $.extend(_defaults,opts);
		$(document).on(opts.trigger+" "+opts.close,this.selector,function(e){
			if(e.type == opts.trigger){
                if(e.keyCode == 13) return;
				var target = e.target;
				if(target.value.length >= opts.triggerLength){
					_autoComplete.hideOthers.call(target);
					_autoComplete.show.call(target,opts);
				}else{
					_autoComplete.close.call(target,opts);
				}
			}else{
				$(document).one("click",function(){
					_autoComplete.close.call(target,opts);
				});
			}
		});

		$(document).on("keyup",this.selector,function(e){
			var target = e.currentTarget;
			switch(e.keyCode){
				case 13: _autoComplete.select.call(target,opts);break;//enter
				case 27: _autoComplete.close.call(target,opts);break;//esc
				case 37: _autoComplete.prev.call(target);break;//left
				case 38: _autoComplete.prev.call(target);break;//up
				case 39: _autoComplete.next.call(target);break;//right
				case 40: _autoComplete.next.call(target);break;//down
				defult:break;
			}
		});

		$(document).on("click","."+opts.css+" li",function(e){
			var $autoCompleteList = $(e.currentTarget);
			if($autoCompleteList[0].tagName == "LI"){
				var $ul = $autoCompleteList.closest("ul");
				var data = $autoCompleteList.data("data");
				$ul[0]._input.value = data.value;
			}
			_autoComplete.close.call($autoCompleteList,opts);
		});
	}

	var _idGenerator = function(){
		var i = 1;
		this.next=function(){
			return i++;
		}
	};

	var idGenerator = new _idGenerator();

	var _autoComplete = {

		format : function(){
			if (arguments.length == 0) {
				return;
			}
			var src = arguments[0];
			for (var i = 1, l = arguments.length; i < l; i++) {
				src = src.replace(new RegExp("\\{" + (i - 1) + "\\}", "gi") , arguments[i]);
			}
			return src;
		},

		//获取数据
		getData:function(opts){
			var target = this;
			var data = opts.data;
			var $dfd = $.Deferred();
			if(data instanceof Array){//数组
				$dfd.resolve(data);
			}else if($.isFunction(data)){//方法获取
				$dfd.resolve(data.call(target));
			}else if(typeof(data) == "string"){//url获取
				$.ajax({
					url:data,
					type:opts.ajaxtype,
					dataType:opts.ajaxDataType,
					data:opts.ajaxParam
				}).done(function(resultData){
					if(opts.customFormat){
						$dfd.resolve(opts.customFormat.call(target,resultData));
					}
				});
			}
			return $dfd.promise();
		},

		//格式化数据
		formatData:function(data){
			var formatedData = new Array();
			$.each(data,function(index,d){
				if(typeof(d)=="string"){
					d = {text:d,value:d,img:d};
				}else if(typeof(d)=="object"){
					var text = d.text || "";
					d.text = text;
					d.value = d.value || d.text;
					d.img = d.img || d.text;
				}
				formatedData.push(d);
			});
			return formatedData;
		},
		//高亮关键字
		highlight:function(d){
			var target = this;
			var value = target.value;
			var regex = new RegExp(value, "gi");
			if(regex.exec(d.text)){
				d.text = d.text.replace(regex,"<span class=\"high-light\">"+value+"</span>");
				return true;
			}
			return false;
		},
		//创建节点（-->createElement）
		ce:function(tag,opts){
			var tag = document.createElement(tag);
			tag._id = idGenerator.next();
			var $tag = $(tag);
			for(var name in opts){
				$tag.attr(name,opts[name]);
			}
			return $tag;
		},

		createListItem : function(index,data){//默认选择第一条
			var $li = _autoComplete.ce("li",index==0?({class:"selected"}):{}).html(data.text);
			$li.data("data",data);//设置数据
			return $li;
		},

		renderList:function(opts){
			var target = this;
			var $container = target._autoCompleteConatiner.empty();
			_autoComplete.getData.call(target,opts).done(function(data){
				data = _autoComplete.formatData.call(target,data);
				var index = 0;
				$.each(data,function(i,d){
					if(_autoComplete.highlight.call(target,d)){
						$container.append(_autoComplete.createListItem(index++,d));
					}
				});
                target._autoCompleteConatiner = $container;
			});
			return $container;
		},

		createListContainer:function(opts){
			var target = this;
			if(typeof(target._autoCompleteConatiner) == 'undefined'){
				var $ul = _autoComplete.ce("ul",{class:opts.css,style:"left:"+opts.left+"px;top:"+opts.top+"px;"});
				target._autoCompleteConatiner  = $ul;
				$ul[0]._input = target;
				$(document.body).append(target._autoCompleteConatiner);
			}
			return target._autoCompleteConatiner;
		},

		show:function(opts){
			var target = this;
            var $target = $(target);
			opts.top = $target.offset().top + target.offsetHeight+2;
			opts.left = $target.offset().left;

			_autoComplete.createListContainer.call(target,opts).addClass("active");
			
			_autoComplete.renderList.call(target,opts);
        },

		hideOthers:function(){
			var target = this;
			$("._auto-complete.active").not(function(index,ele){
				return target._autoCompleteConatiner && ele._id == target._autoCompleteConatiner[0]._id;
			}).removeClass("active");
		},

		close:function(opts){
			$("."+opts.css+".active").removeClass("active");
		},

		next:function(){
			var autoCompleteConatiner = this._autoCompleteConatiner;
			if(!autoCompleteConatiner) return false;

			var selectedIndex = autoCompleteConatiner.selectedIndex || 0;
			var length = $("li",autoCompleteConatiner).length;

			if(selectedIndex == length-1){
				selectedIndex = 0;
			}else{
				selectedIndex++;
			}
			$(".selected",autoCompleteConatiner).removeClass("selected");
			$("li:eq("+selectedIndex+")",autoCompleteConatiner).addClass("selected");
			autoCompleteConatiner.selectedIndex = selectedIndex;
		},

		prev:function(){
			var autoCompleteConatiner = this._autoCompleteConatiner;
			if(!autoCompleteConatiner) return false;

			var selectedIndex = autoCompleteConatiner.selectedIndex || 0;
			var length = $("li",autoCompleteConatiner).length;

			if(selectedIndex == 0){
				selectedIndex = length-1;
			}else{
				selectedIndex--;
			}
			$(".selected",autoCompleteConatiner).removeClass("selected");
			$("li:eq("+selectedIndex+")",autoCompleteConatiner).addClass("selected");
			autoCompleteConatiner.selectedIndex = selectedIndex;
		},

		select:function(){
			var target = this;
			var autoCompleteConatiner = target._autoCompleteConatiner;
			if(!autoCompleteConatiner) return false;

			var selectedIndex = autoCompleteConatiner.selectedIndex || 0;
			var data = $("li:eq("+selectedIndex+")",autoCompleteConatiner).data("data");

			target.value = data.value;
			$(autoCompleteConatiner).removeClass("active");
		}

	}
})(jQuery);