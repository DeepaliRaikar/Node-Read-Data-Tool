import "jquery";
import "../../shell/js/common/lib/jquery-ui.min";
import "jquery-ui-touch-punch";
var interact = require("interactjs");
import "./dnd_m.scss";
import PlayerConfig from "../../shell/player_config";
import {scaleElements} from "../../shell/js/common/scaling";

export const dnd_m = function() {
  var obj = {
    // ------ private variables -------
    templateData: {},
    parentEle: null,
    titleAudiostatus: 0,
    //--------Render Functions used to bind Events ?-----------//
    render: function() {
      var self = this;
      self.setEvents();
    },
    //--------- Creating DOM ------------//
    createDomElements: function() {
      var self = this,
        content = "";
      content += `<div class=${self.templateData.templateName}>`;
      content += "<div class='image_container'>";
      for (var i = 0; i < self.templateData.imageData.length; i++) {
        content += "<div class='draggableParent' id='draggable_" + (i + 1) + "'><div class='draggables dragElement' id=image_" + (i + 1) + " label='" + self.templateData.imageData[i].label + "'></div></div>";
      }
      content += "</div>";
      content += "<div class='left_box'>";
      content += "<div class='dummyDroppable' id='left_dummy'></div>";
      content += "<div class='droppables' id='left_basket'>";
      content += "<div class='basket_back'></div>";
      content += "<div class='basket_front'></div>";
      content += "</div>";
      content += "</div>";
      content += "<div class='right_box'>";
      content += "<div class='dummyDroppable' id='right_dummy'></div>";
      content += "<div class='droppables' id='right_basket'>";
      content += "<div class='basket_back'></div>";
      content += "<div class='basket_front'></div>";
      content += "</div>";
      content += "</div>";
      content += "</div>";
      content += "<div class='que_text'><div class='text_data'>" + self.templateData.ostArr + "</div></div>";
      content += "<div class='lastdiv'></div>";

      self.parentEle.html(content);

      for (var j = 0; j < self.templateData.imageData.length; j++) {
        $("#image_" + (j + 1)).css("background-image", "url(" + self.templateData.imageData[j].image + ")");
      }
      for (var k = 0; k < self.templateData.imageData.length; k++) {
        $("#draggable_" + (k + 1)).css(self.templateData.imageData[k].style);
      }
    },

    //----- For Sprite sheet generation ----------------
    createSprite: function() {},

    //------ Sprite animation callback ------------------
    animComplete: function() {},

    //---------- Events to be bind here -----------------------
    setEvents: function() {
      var self = this;
      self.dropArr = [];

      if (PlayerConfig.screenLoadCount > 0) {
        self.titleAudioEnd();
      }

      $(".que_text").off("click").on("click", function() {
        self.audioController.stopAll();
        self.audioController.playAudio(2);
      });
      $(`.${self.templateData.templateName} .draggableParent`).off("click").on("click", function() {
        var label = $(this).find(".draggables").attr("label");
        var audioPath = self.templateData.objectAudios[label];
        var currAudioIndex = self.audioArr.indexOf(audioPath);
        // self.audioController.stopAll();
        self.audioController.playAudio(currAudioIndex);
      });

      // $(`.${self.templateData.templateName} .draggables`).off("click").on("click", function() {
      //   if ($(this).hasClass("dropped")) {
      //     var label = $(this).attr("label");
      //     var audioPath = self.templateData.fullObjectAudio[label];
      //     var currAudioIndex = self.audioArr.indexOf(audioPath);
      //     // self.audioController.stopAll();
      //     self.audioController.playAudio(currAudioIndex);
      //   }
      // });

      // tap event for the draggable element which is same as click event
      interact("." + self.templateData.templateName + " .draggables").off("tap").on("tap", function(event) {
        if (self.eleHasClass(event.currentTarget, "dropped")) {
          var label = event.currentTarget.getAttribute("label");
          var audioPath = self.templateData.fullObjectAudio[label];
          var currAudioIndex = self.audioArr.indexOf(audioPath);
          // self.audioController.stopAll();
          self.audioController.playAudio(currAudioIndex);
        }
      });


      var startPos = {
        x: 0,
        y: 0
      };

      // Interact Draggable event
      interact(".dragElement").draggable({
        snap: {
          targets: [startPos],
          range: 5,
          relativePoints: [
            {
              x: 0.5,
              y: 0.5
            }
          ]
        },
        onstart: function(event) {
          let rect = interact.getElementRect(event.target);

          // record center point when starting the very first a drag
          startPos = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };

           // always snap to the start
          event.interactable.draggable({
            snap: {
              targets: [startPos]
            }
          });

          if (!event.target.hasAttribute("data-start-x")) {
            rect = interact.getElementRect(event.target);

            // record the initial center point to data-start-x and data-start-y when starting the very first a drag
            event.target.setAttribute("data-start-x", rect.left + rect.width / 2);
            event.target.setAttribute("data-start-y", rect.top + rect.height / 2);
          }
          if (!event.target.hasAttribute("data-image")) {
            rect = interact.getElementRect(event.target);
            // record the background image if required
            event.target.setAttribute("data-image", event.target.style.backgroundImage);
          }
        },
        // call this function on every dragmove event
        onmove: function(event) {
          var target = event.target,
            // keep the dragged position in the data-x/data-y attributes
            x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx,
            y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

          // translate the element
          target.style.webkitTransform = target.style.transform = "translate(" + x + "px, " + y + "px)";

          // update the posiion attributes
          target.setAttribute("data-x", x);
          target.setAttribute("data-y", y);

          target.classList.add("getting--dragged");
          var scaleFactor = Number(PlayerConfig.scaleFactor) * Number(PlayerConfig.elementScale);
          // var scaleFactor = Number(parentScaling)*Number(childScaling);
          var changeLeft = parseFloat(target.getAttribute("data-x")) - parseFloat(target.getAttribute("data-start-x")); // find change in left

          var newLeft = (parseFloat(target.getAttribute("data-start-x")) + changeLeft) / scaleFactor; // adjust new left by our zoomScale
          var changeTop = parseFloat(target.getAttribute("data-y")) - parseFloat(target.getAttribute("data-start-y")); // find change in top
          var newTop = (parseFloat(target.getAttribute("data-start-y")) + changeTop) / scaleFactor; // adjust new top by our zoomScale
          target.style.webkitTransform = target.style.transform = "translate(" + newLeft + "px, " + newTop + "px)";
        },
        onend: function(event) {
          event.target.classList.remove("getting--dragged");
          event.target.style.webkitTransform = event.target.style.transform = "none";
          event.target.setAttribute("data-x", 0);
          event.target.setAttribute("data-y", 0);
        }
      });

      // Interact Droppable event
      interact(".dummyDroppable").dropzone({
        accept: ".dragElement",
        // Require a 30% element overlap for a drop to be possible
        overlap: 0.3,
        ondropactivate: function(event) {
          event.target.classList.add("can--drop");
        },

        // When the draggable element enters the droparea
        ondragenter: function(event) {
          var draggableElement = event.relatedTarget,
            dropzoneElement = event.target,
            dropRect = interact.getElementRect(dropzoneElement),
            dropCenter = {
              x: dropRect.left + dropRect.width / 2,
              y: dropRect.top + dropRect.height / 2
            };

          event.draggable.draggable({
            snap: {
              targets: [{
                dropCenter
              }]
            }
          });
          // feedback the possibility of a drop
          dropzoneElement.classList.add("can--catch");
          draggableElement.classList.add("drop--me");
        },

        // When the draggable element moves out of the drop area
        ondragleave: function(event) {
          // remove the additional classes added while starting the drag event
          event.target.classList.remove("can--catch", "caught--it");
          event.relatedTarget.classList.remove("drop--me");
          //event.interaction.stop();
        },

        // When the draggable element is dropped in the drop area
        ondrop: function(event) {
          var draggableElement = event.relatedTarget,
            dropzoneElement = event.target;

          if (event.target.childNodes.length != self.templateData.capacityOfBasket) {
            event.target.classList.add("caught--it");
            draggableElement.removeAttribute("style");
            dropzoneElement.append(draggableElement);
            draggableElement.style.backgroundImage = draggableElement.getAttribute("data-image");
            draggableElement.style.marginTop = "-40px";
            draggableElement.style.webkitTransform = draggableElement.style.transform = "none";
            draggableElement.classList.add("dropped");
            draggableElement.classList.remove("dragElement");
            self.dropArr.push(this);
            var label = draggableElement.getAttribute("label");
            var audioPath = self.templateData.fullObjectAudio[label];
            var currAudioIndex = self.audioArr.indexOf(audioPath);
            self.audioController.playAudio(currAudioIndex);
            var noOfDropped = $("#left_dummy").children(".draggables").length + $("#right_dummy").children(".draggables").length;
            if (self.templateData.noOfDraggables == noOfDropped) {
              setTimeout(function() {
                try {
                  // self.audioController.stopAll();
                 }
                 catch(err) {
                  //   message.innerHTML = "Input " + err;
                 }
                self.audioController.playAudio(1);
              }, 2500);
            }
          }
        },
        // after the drop event
        ondropdeactivate: function(event) {
          // remove active dropzone feedback
          event.target.classList.remove("can--drop");
          event.target.classList.remove("can--catch");
        }
      });

      PlayerConfig.view.InstructionView.initialize(self.templateData.instText); //for footer instruction
    },

    //------------ Audio current time callback---------------
    audioCurrentTime: function() {},

    //------------ Audio end callback---------------------
    audioEnd: function() {},

    titleAudioEnd: function() {
      var self = this;
      if (self.titleAudiostatus == 0) {
        self.audioController.playAudio(2);
        self.titleAudiostatus++;
      }
    },
    //----------- Destroy all variables, object to make sure memory release ------------
    destroy: function() {
      var self = this;
      self.templateData = null;
      self.parentEle = null;
      self.imgArr = null;
      self.audioArr = null;
      self.animationController = null;
      self.audioController = null;
      self.videoController = null;
    },
    actionClick: function() {
      // Do your action here;
    },

    preloadAssets: function() {
      var self = this;
      const {audios} = self.templateData.preloadData;
      self.audioArr = JSON.parse(JSON.stringify(audios));
      self.audioController = PlayerConfig.controllers.AudioController;
      self.audioController.loadAudios(self.audioArr, self.audioCurrentTime, self.audioEnd);
    },

    initialize: function(data, ele) {
      var self = this;
      self.templateData = data;
      self.parentEle = ele;
      self.preloadAssets();
      self.createDomElements();
      //self.createSprite();
      self.render();
      scaleElements(self.templateData.scaleElements, self.templateData.minScale);
    },
    eleHasClass: function(el, cls) {
      return el.className && new RegExp("(\\s|^)" + cls + "(\\s|$)").test(el.className);
    }

  };
  return obj;
};
