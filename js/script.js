var app = angular.module('login',[]);

app.controller('login-register', function ($scope,$http,$window) {	
	
	//var socket = io.connect(window.location.hostname);
	
	$scope.show_register=false;
   	$scope.show_login_error=true;
    $scope.show_name_error=true;

	$scope.Login_Form=function(item){
		var login_name=$scope.name;
		var password=$scope.Password;
		$http.post('/login', {'name': login_name, 'password': password}).success(function(data, status, headers, config) {
         	if(String(data.data).trim()=="valid"){
            	$scope.show_login_error=true;
                $window.location.href = data.path_name;
            }else{
            	$scope.show_login_error=false;                
            }
        }).error(function(data, status) {
            console.log("Connection Error");
            alert("Connection Error");
        });
	}
	$scope.check_name=function(item){
		var reg_name=$scope.name;
		$http.post('/check_name', {'name': reg_name}).success(function(data, status, headers, config) {
           if(String(data.data).trim()=="available"){
            	$scope.show_name_error=true;
            }else{
            	$scope.show_name_error=false;
            }
        }).error(function(data, status) {
            alert("Connection Error");
        });
	}

	$scope.processForm=function(item){
		var name=$scope.name;
        var password=$scope.Password;
        
        $http.post('/register',{'name': name, 'password': password}).success(function(data, status, headers, config) {
           console.log(data);
            $window.location.href = data.path_name;
        }).error(function(data, status) {
            alert("Connection Error");
        });
	}

/*------------------------------------------------ Register --------------------------------------------------------------*/	





});