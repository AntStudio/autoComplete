;
/**
* jQuery 自动补全插件
* author: GavinCook
* 功能特性：
* 1. 本地指定数据补全 (not done)
* 2. 异步数据补全(json格式) (not done)
* 3. 补全列表尺寸设置(高度、宽度) (not done)
* 4. 动态补全事件绑定(可为还不存在的元素绑定自动补全触发事件) (not done)
* 5. 多触发方式(keydown,keyup,方向键) (not done)
**/
(function($){
	var _defaults = {
		trigger : "keyup",//触发方式
		triggerLength: 1,//触发长度,只有当内容的长度达到设置才会触发自动补全
		data:[]//列表数据 : array , function , deferred.
		
	}

	$.fn.autoComplete = function(opts){
		
	}
})(jQuery);