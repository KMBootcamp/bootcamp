function onLoad(){
  console.log("height - " + document.getElementsByTagName("img")[0].height + "px");
  console.log("width - " + document.getElementsByTagName("img")[0].width + "px");
}

var index = 0;

function next(){

  setInterval(function(){
    for(var i = 0; i < 9; i++){
      document.getElementsByTagName('td')[i].style.color = "black";
    }

      document.getElementsByTagName("td")[index].style.color = "red";
      index++;
      if(index === 9){
        index = 0;
      }
    }, 300);
}
