/*  Plugin: prettyTag (Auto Colored Tags)
 *   Frameworks: jQuery 3.3.1
 *   Author: Asif Mughal
 *   GitHub: https://github.com/CodeHimBlog
 *   URL: https://www.codehim.com
 *   License: MIT License
 *   Copyright (c) 2018 - Asif Mughal
 */
/* File: jquery.prettytag.js */

(function ($) {
  $.fn.prettyTag = function (options) {
    var setting = $.extend({
      randomColor: true, //false to off random color
          tagicon: true, //false to turn off tags icon
           tagURL: "#",  //url that will be assigned to new tags when user enter a tag name
         addCount: true,
       adjustSize: true,
    }, options);

    return this.each(function () {
      var $target = this;
      var tagsManager = []; //an array to store new tag name and URL
      var newTag = -1;

      $($target).addClass("cloud-tags");

      var eachTag = $($target).find("a");

      //add font awesome icon
      if (setting.tagicon == true) {
        var $ti = document.createElement("i");
        $($ti).addClass("fa fa-tags").prependTo(eachTag);
      }

      if (setting.addCount == true) {
        eachTag.each(function(){
          var count = $(this).attr("data-count");
          $(this).append($("<span></span>").text(count));
        });
      }

      if (setting.adjustSize == true) {
        var counts = eachTag.map(function(){
          return parseInt($(this).attr("data-count"));
        });
        var max = Math.max(...counts);
        var min = Math.min(...counts);

        // logarithmic scale between 1em and 1.5em;
        var minp = 1;
        var maxp = 1.5;
        var minv = Math.log(min);
        var maxv = Math.log(max);
        var scale = (maxv-minv) / (maxp-minp);

        eachTag.each(function(){
          var count = parseInt($(this).attr("data-count"));
          var size  = (Math.log(count)-minv) / scale + minp;
          $(this).css({
            "font-size": size+"em"
          });
        });

      }

      // close tag
      function closeTag() {

        var closeAbleTag = $(".cloud-tags").find("span");
        $(closeAbleTag).html("×");
        $(closeAbleTag).click(function () {
          $(this).parent().remove();
        });
      }

      coloredTags();
      //function to make tags colorful
      function coloredTags() {
        var totalTags = $(".cloud-tags").find("li").length; //to find total cloud tags
        var mct = $(".cloud-tags").find("a"); //select all tags links to make them colorful

        /*Array of Colors */
        var tagColor = ["#ff0084", "#ff66ff", "#43cea2", "#D38312", "#73C8A9", "#9D50BB",
          "#780206", "#FF4E50", "#ADD100",
          "#0F2027", "#00c6ff", "#81D8D0", "#5CB3FF", "#95B9C7", "#C11B17", "#3B9C9C", "#FF7F50", "#FFD801", "#79BAEC", "#F660AB", "#3D3C3A", "#3EA055"
        ];

        var tag = 0;
        var color = 0; //assign colors to tags with loop, unlimited number of tags can be added
        do {
          if (color > 21) {
            color = 0;
          } //Start again array index if it reaches at last

          if (setting.randomColor == true) {
            var $rc = Math.floor(Math.random() * 22);
            $(mct).eq(tag).css({
              //tags random color
              'background': tagColor[$rc]
            });
          } else {
            $(mct).eq(tag).css({
              //tags color in a sequence
              'background': tagColor[color]
            });
          }

          tag++;
          color++;
        } while (tag <= totalTags)

      }

    });
  };

})(jQuery);
/*   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
