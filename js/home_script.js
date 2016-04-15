var app = angular.module('home',['luegg.directives']);
var name_deocde="";
var name_to_deocde="";

app.controller('home_controller', function ($scope,$http,$location) {	

//var socket = io.connect("http://localhost:8000");
var socket = io();
var con_list=[]; 
$scope.chat_label_hide_show=true;
    
	$http.post('/check_session', {}).success(function(data, status, headers, config) {
		if(data.redirect=="valid"){
			$scope.from_id=$location.search()['ui'];
			$scope.name=$location.search()['un'];
			// decoding of base64
			$scope.name_deocde=atob($location.search()['un']);               
			get_chat_list(); 
		}else{
			alert("Something went wrong.");
		}
	}).error(function(data, status) {
		alert("Bad");
	});     

	$scope.send_friend_request=function(item){
        var name=$scope.name;
        var id=$scope.from_id;

		$http.post('/getList', {'name': name, 'id': id}).success(function(data, status, headers, config) {
           $scope.con_new_list=data;
        }).error(function(data, status) {
            alert("Bad");
        });
	}
    
	//animations in angulerJS
    var selectedIndex=null;
    var selected_shadow=null;
    $scope.toggle =true;
    
    $scope.animate_hover_modal=function(id){
        $scope.selectedIndex = null;
    }
	
    $scope.animate_hover_leave_modal=function(id){
        $scope.selectedIndex = id;
    }
    
	$scope.show_msg_box_modal=function(id){
        var btn_name = document.getElementById("send_msg_new_con_"+id).innerHTML;
        "X"==btn_name ? $scope.selected_shadow=null : $scope.selected_shadow = id;
        $scope.toggle =false;
        $scope.animate_div_send={
            '-webkit-box-shadow': '0px 0px 53px -8px rgba(0,0,0,0.75)',
            '-moz-box-shadow': '0px 0px 53px -8px rgba(0,0,0,0.75)',
            'box-shadow':'0px 0px 53px -8px rgba(0,0,0,0.75)'
        };
    };

    $scope.send_msg_new=function(id,name){
        $scope.to_id=id;
        $scope.name_to_deocde=name;
        $scope.chat_label_hide_show=false;
		get_conversation_msg(id,"send_msg_new");
		get_chat_list();
    }
    
	$scope.select_contact=function(id,name){
        $scope.to_id=id;
        $scope.name_to_deocde=name;
        $scope.chat_label_hide_show=false;
		get_conversation_msg(id,"chat_list");
		get_chat_list();
    }
	
    function get_chat_list(){
        var name=$scope.name;
        var id=$scope.from_id;
        $http.post('/get_chat_list', {'name': name, 'id': id}).success(function(data, status, headers, config) {
            $scope.names=data;
        }).error(function(data, status) {
            alert("Bad");
        });
    }
	
	$scope.send_msg=function(){
        var id=$scope.to_id;
        if(!id){
            alert("please select the Conversation");
        }else{
            get_conversation_msg(id,"chat_list");
        }
    }

    function get_conversation_msg(id,which_one){
        var to_id=id;
        var from_id=$scope.from_id;
        var msg="";
        if(which_one=="chat_list"){
            msg= document.getElementById("big_msg_box").value;
        }else{
            msg= document.getElementById("new_chat_"+id).value;
        }
        var data_server={
            msg:msg,
            to_id:to_id,
            from_id:from_id
        }
        socket.emit('get msg',data_server);

		if(which_one=="chat_list"){
            document.getElementById("big_msg_box").value="";
        }else{
            document.getElementById("new_chat_"+id).value="";
        }
    }

    socket.on('set msg',function(data){
        get_chat_list();
		if($scope.to_id){
            $scope.con_list=$.parseJSON(data);
            $scope.$apply();
        }
    });
});