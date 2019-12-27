
// https://github.com/jgthms/bulma/issues/238 thanks!
document.getElementById("nav-toggle").addEventListener("click", toggleNav);
function toggleNav() {
    var nav = document.getElementById("nav-menu");
    var className = nav.getAttribute("class");
    if(className == "nav-right nav-menu") {
        nav.className = "nav-right nav-menu is-active";
    } else {
        nav.className = "nav-right nav-menu";
    }
}

// for the random quote in the header
var txtFile = new XMLHttpRequest();
txtFile.open("GET", "/quotes.txt", true);
txtFile.onreadystatechange = function () {
    if (txtFile.readyState === 4) {
        if (txtFile.status === 200) {
            allText = txtFile.responseText;
            lines = txtFile.responseText.split("\n");
            randLine = lines[Math.floor((Math.random() * lines.length) + 1)];
            document.getElementById('quote').innerHTML = randLine ||
                "Intelligence is the ability to adapt to change."; // fallback quote
        }
    }
};
txtFile.send(null);

document.getElementById("search-text").addEventListener("keydown", function(e) {
    // search
    if (e.keyCode == 13) { searchHandler(); }
}, false);

function searchHandler() {
    var searchInput = document.getElementById('search-text');
    var text = searchInput.value;
    // add site:example.com in the placeholder
    window.location.href = "https://www.google.com/search?q=site:binford2k.com " + text;
}

$( document ).ready(function() {
  $("#newpost").on("click", function(e){
    e.preventDefault();

    var date = new Date().toISOString().split('T')[0];
    var text = "---\n"             +
            "layout: post\n"    +
            "title: new post\n" +
            "summary:\n"        +
            "image:\n"          +
            "category:\n"       +
            "tags: []\n"        +
            "---\n"
    var params = "filename=_posts/"+date+"-new-post.md&value="+encodeURI(text);
    var href   = $(this).attr("href").split('?')[0];

    window.open(href+'?'+params);
  });

  var currentDate  = new Date();
  var currentMonth = currentDate.getMonth()+1; // becuz jabbascript
  var currentDay   = currentDate.getDate();

  var holidays = {
    1: {
      1: function(){confetti.start()}
    },
    7: {
      4: function(){launchFireworks()}
    },
    12: {
      24: function(){sparklyTree()},
      25: function(){sparklyTree()},
      31: function(){confetti.start()}
    }
  }

  if (holidays[currentMonth] && holidays[currentMonth][currentDay]) {
    $("canvas#scene").show();
    holidays[currentMonth][currentDay]();
  }

});
