function updateamount(){
var e = document.getElementById("payfor");
var selected = e.options[e.selectedIndex].text;
if(selected == 'Semester Fees')
  {
     document.getElementById("amount").value=65500;
  
  }
else
  {
    document.getElementById("amount").value=15000;
  }

}

/*
function paybuttonclicked(){
    alert('Payment Successful');
}*/