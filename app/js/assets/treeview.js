/*
 QUADCORE ENGINEERING MSB
*/
(function($){
  var checkedNode = [];

    $.fn.extend({
        load : function(data){
          var genDiagram = function (obj)
          {
            var createUl = function (obj, name_first)
            {
              var h = '';
              h += '<li><label><input type="checkbox" />' + name_first + '</label>';
              $.each(obj, function(key, value) {
                 h += '<ul>';
                 $.each(value, function(k, v) {
                   h += '<li><label><input type="checkbox" />' + k + '</label>';
                   $.each(v, function(a, b) {
                      h += '<ul>';
                      $.each(value, function(k, v) {
                         h += '<li><label><input type="checkbox" />' + a + '</label></li>';
                      })
                      h += '</ul>';
                   })
                   h += '</li>';
                 })
                 h += '</ul>';
              })
              h += '</li>';
              return h;
            }

            var globale = '';
            $.each(data, function(key, value) {
              globale += createUl(value, key);
            })
            checkedNode = [];
            $('.tree').empty();
            $('.tree').append(globale);
          }
          genDiagram(data);
        },

        getCheckedPath: function(){
          return checkedNode;
        },

        clearCheckedPath: function(){
          return checkedNode = [];
        },

        treeview: function(){
            $(this)
                .addClass('checktree-root')
                .on('change', 'input[type="checkbox"]', function(e){
                    e.stopPropagation();
                    e.preventDefault();

                    checkParents($(this));
                    checkChildren($(this));
                    pathChecked($(this));
                });
            var pathChecked = function (c)
            {
              var getPath = function (c)
              {
                var path = [];
                var getName = function (c)
                {
                  rootCheckbox = c.find('label:eq(0)');
                  return rootCheckbox.text();
                }

                path.push(c.parent().text());
                var parentLi = c.parents('ul:eq(0)').parents('li:eq(0)');
                if (parentLi.length)
                {
                  path.push(getName(parentLi));
                  parentLi = parentLi.parents('ul:eq(0)').parents('li:eq(0)');
                  if (parentLi.length) {
                    path.push(getName(parentLi));
                    parentLi = parentLi.parents('ul:eq(0)').parents('li:eq(0)');
                    if (parentLi.length) {
                      path.push(getName(parentLi));
                    }
                  }
                }
                path.reverse();
                return path.join('/');
              }

              if (c.is(':checked')){
                checkedNode.push(getPath(c));
              } else{
                var index = checkedNode.indexOf(getPath(c));
                if (index > -1) {
                    checkedNode.splice(index, 1);
                }
              }

            }


            var checkParents = function (c)
            {
                var parentLi = c.parents('ul:eq(0)').parents('li:eq(0)');

                if (parentLi.length)
                {
                    var siblingsChecked = parseInt($('input[type="checkbox"]:checked', c.parents('ul:eq(0)')).length),
                        rootCheckbox = parentLi.find('input[type="checkbox"]:eq(0)');

                    if (c.is(':checked')){
                        rootCheckbox.prop('checked', true)
                    } /*else if (siblingsChecked === 0) {
                        rootCheckbox.prop('checked', false);
                    }*/

                    checkParents(rootCheckbox);
                }
            }

            var checkChildren = function (c)
            {
                var childLi = $('ul li input[type="checkbox"]', c.parents('li:eq(0)'));

                if (childLi.length){
                    childLi.prop('checked', c.is(':checked'));
                }
            }
        }

    });
})(jQuery);
