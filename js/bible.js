//바로찾기
var version = 'koreankjv';
var name = 'genesis';
var chapter = 1;

var bible_name; //배열
var bible_count;
var max_chapter; //배열

/*랜덤함수*/
var random_biblenum;
var p_book;
var p_chapter;
var p_verse;

/*소주제 개수 보관을 위해 전역변수로 활용*/
var subtitle;
var subtitle_count;

var size_unit = 5; //확대축소 단위
var cur_font_size = 24; //현재 폰트사이즈

$(document).ready(function () {
  //맨 처음에 목차xml을 불러오는 메소드
  $.ajax({
    type: 'GET',
    url: 'bible/contents.xml',
    dataType: 'xml',
    async: false,
    success: response_parse,
  });
});

$(function () {
  //확장/숨김버튼 클릭 시
  $button_tap = $('ul#tap li#visible_menu a');
  $button_tap.click(function () {
    if ($button_tap.text() == '숨김') {
      $('div#lnb').slideUp('fast');
      //$("div#lnb:not(:animated)").addClass("hidden");
      $button_tap.text('확장');
    } else {
      //$("div#lnb").removeClass("hidden");
      $('div#lnb').slideDown('fast');
      $button_tap.text('숨김');
    }
  });

  //성경 책 이름 클릭시 강조
  $button_menu = $('div#lnb ul li a');
  $button_menu.click(function () {
    $button_menu.removeClass('selected');
    $(this).addClass('selected');
  });

  //성경 버전 선택시
  $version = $('ul#version a');
  $version.click(function () {
    $version.removeClass('selected');
    $(this).addClass('selected');
  });

  //섞기버튼 클릭 시
  $random_tap = $('#random p a');
  $random_tap
    .click(function () {
      $('#random p a img').addClass('clicked');
      $('div#random').slideUp('fast');
      $('div#random').slideDown('fast');
    })
    .mouseout(function () {
      $('#random p a img').removeClass('clicked');
    });

  //확대버튼 클릭 시
  $content = $('table#table_bible_content');
  $font_bigger = $('ul#tap li#font_bigger a');
  $font_bigger.click(function () {
    if (cur_font_size < 84) cur_font_size += size_unit;
    $('table#table_bible_content .verse').css('fontSize', cur_font_size + 'px');
  });

  //축소버튼 클릭 시
  $font_smaller = $('ul#tap li#font_smaller a');
  $font_smaller.click(function () {
    if (cur_font_size > 10) cur_font_size -= size_unit;
    $('table#table_bible_content .verse').css('fontSize', cur_font_size + 'px');
  });
});

function setName(nameValue) {
  name = nameValue;
  chapter = 1;
  openBook(name);
  scrollToTheBibleChapter();
}
function setVersion(versionName) {
  //버전 세팅
  version = versionName;
  openBook(name);
  highlightVerse();
}
function setChapter(chapterValue) {
  chapter = chapterValue;
  openBook(name);
}
function response_parse(xml) {
  //목차xml에서 필요한 데이터만 추출하여 목차를 시각적으로 메뉴화함.
  $book = $(xml).find('book');
  window.b = $book;
  bible_count = $book.length;
  //성경이름별 넘버와 최대 장 수 배열만들기.
  bible_name = Array.from(b).map((item) => item.querySelector('name').innerHTML);
  max_chapter = Array.from(b)
    .map((item) => item.querySelector('chapter').innerHTML)
    .map(Number);
  //$("div#bible_index").prepend("<b>성경 권 수 : " + bible_count + "권</b>");

  //book 헤더 돌기
  var count = 0;
  var age;
  var contents;
  $book.each(function () {
    //성경 권 수 카운트
    count++;
    //최대 장 수 갱신시키기
    // max_chapter[count - 1] = $(this).find('chapter').text();
    switch (count) {
      case 1:
        age = 'old';
        $('ul#' + age).before('<p class="old age">구약</p>');
        break;
      case 40:
        age = 'new';
        $('ul#' + age).before('<p class="new age">신약</p>');
    }
    //구약/신약 별로 ul나누어 li 추가
    var name = $(this).find('name').text();
    var eng_name = $(this).find('eng_name').text().toLowerCase();
    eng_name = eng_name.replace(/ /gi, ''); //공백제거
    bible_name[count - 1] = eng_name; //성경책 이름 배열에 순차적으로 넣기.
    $('ul#' + age).append(
      '<li id="book_' + eng_name + '"><a href="javascript:setName(\'' + eng_name + '\')">' + name + '</a></li>'
    );
  });
  $('div#bible_index').append(contents);
  randomPointer();
} //function response_parse

function openBook(bookName) {
  //차례에서 책을 선택하면 해당하는 책의 1장내용을 띄워준다.
  //alert("./bible/" + version + "/" + bookName + "/1.xml");
  name = bookName;
  $.ajax({
    type: 'GET',
    url: 'bible/' + version + '/' + bookName + '/' + chapter + '.xml',
    dataType: 'xml',
    async: false,
    success: showBook,
  });
}

function showBook(xml) {
  var lineCount = 0;
  var addOddClass;
  var hoverChapter; //현재 장 강조스타일 씌우기
  $('div#viewer').removeClass('hidden');
  $('div#viewer').addClass('show');

  $book = $(xml).find('bible');
  var bookName = $book.attr('name');
  const engName = $book.attr('eng_name');

  //책이름 + 몇 장인지 attribute 불러오기
  //나중에 장은 메뉴화시켜야하니까 글자는 빼야지.
  $('div#bible_title div.title h2').html('<a href="javascript:scrollToTheBibleContent()">' + bookName + '</a>');
  $('div#bible_chapter').text('');
  //장 추가

  const bibleIndex = bible_name.findIndex(
    (b) => b.toLowerCase().replace(/\s/g, '') === engName.toLowerCase().replace(/\s/g, '')
  );
  for (var i = 1; i <= max_chapter[bibleIndex]; i++) {
    if (chapter == i) {
      hoverChapter = ' class="hover"';
    } else {
      hoverChapter = '';
    }
    $('div#bible_chapter').append(
      '<p><a' + hoverChapter + ' href="javascript:setChapter(' + i + ')">' + i + '</a></p>'
    );
  }

  //구절 불러오기
  $('table#table_bible_content tbody').text(null);
  //주제 불러오기
  subtitle = new Array($book.find('subtitle').length);
  subtitle_count = 0;
  $book.find('subtitle').each(function () {
    subtitle[subtitle_count] = $(this).attr('vno');
    subtitle_count++;
  });

  addOddClass = '';
  $book.find('v').each(function () {
    lineCount++;
    for (var i = 0; i < subtitle.length; i++) {
      if (lineCount == subtitle[i]) {
        //주제가 걸려있다면?
        $('table#table_bible_content tbody').append(
          '<tr><td class="subtitle" colspan="2">' + $book.find('subtitle').eq(i).text() + '</td></tr>'
        );
      }
    }

    if (lineCount % 2) addOddClass = ' class="odd"';
    else addOddClass = '';
    var cur_verse = $(this).text();
    $('table#table_bible_content tbody').append(
      '<tr' +
        addOddClass +
        '><td class="line">' +
        lineCount +
        '</td>' +
        '<td class="verse" id="v' +
        lineCount +
        '">' +
        cur_verse +
        '</td></tr>'
    );
  });
  //폰트설정 적용
  $('table#table_bible_content .verse').css('fontSize', cur_font_size + 'px');
}

// function getNumber(bookName) {
//   for (var i = 0; i < bible_name.length; i++) {
//     if (bible_name[i] == bookName) {
//       return i;
//     }
//   }
//   return -1;
// }

function randomPointer() {
  random_biblenum = Math.floor(Math.random() * bible_count);
  p_book = bible_name[random_biblenum];
  p_chapter = Math.floor(Math.random() * max_chapter[random_biblenum]) + 1;
  p_verse;

  //절 설정
  $.ajax({
    type: 'GET',
    url: 'bible/' + version + '/' + p_book + '/' + p_chapter + '.xml',
    dataType: 'xml',
    async: false,
    success: function (xml) {
      $book = $(xml).find('bible');
      $book_name = $book.attr('name');
      const engName = $book.attr('eng_name');
      const bibleIndex = bible_name.findIndex(
        (b) => b.toLowerCase().replace(/\s/g, '') === engName.toLowerCase().replace(/\s/g, '')
      );
      $book_eng_name = bible_name[bibleIndex];
      p_verse = Math.ceil(Math.random() * ($book.find('v').length - 1));
      //화면에 출력
      $('div#random').addClass('show');
      //$("div#random_title").html("<a id=\"random_a\" href=\"javascript:openBook('" +  $book_eng_name + "');setChapter(" + p_chapter + ");random_trigger();\">" + $book_name + " " + p_chapter+ "장 " + (p_verse+1) + "절</a>");
      $('div#random_title').html(
        '<a id="random_a" href="javascript:random_trigger(p_book,p_chapter,p_verse);">' +
          $book_name +
          ' ' +
          p_chapter +
          '장 ' +
          p_verse +
          '절</a>'
      );
      $('div#random_verse').text(
        $book
          .find('v')
          .eq(p_verse - 1)
          .text()
      ); //xml에서 꺼내올땐 -1
    },
    error: function () {
      $('div#random').removeClass('show');
      //$("div#random").html("실패" + p_book + " " + p_chapter + "장" + p_verse + "절<br>" + max_chapter[bible_count-1]);
      randomPointer();
    },
  });
}

function random_trigger(bookName, chapter, verse) {
  openBook(bookName);
  setChapter(chapter);
  $('div#lnb ul li a').removeClass('selected');
  $('div#lnb ul li a').eq(random_biblenum).addClass('selected');
  //절 + 타이틀 + 1

  $('#table_bible_content tr td#v' + verse)
    .parent()
    .addClass('highlight'); //thead때문에 +1해줌

  //스크롤
  $target = $('table#table_bible_content td#v' + verse).offset().top;
  $('html,body').animate({ scrollTop: $target }, 500);
}

function scrollToTheTop() {
  $('html,body').animate({ scrollTop: $('html').offset().top }, 500);
}
function scrollToTheBibleChapter() {
  $('html,body').animate({ scrollTop: $('div#bible_chapter').offset().top }, 300);
}
function scrollToTheBibleContent() {
  $('html,body').animate({ scrollTop: $('table#table_bible_content').offset().top }, 500);
}

function highlightVerse() {
  //#random_a 클릭하면 자동으로 성경 펼쳐줌
  $.ajax({
    type: 'GET',
    url: 'bible/' + version + '/' + p_book + '/' + p_chapter + '.xml',
    dataType: 'xml',
    async: false,
    success: function (xml) {
      $book = $(xml).find('bible');
      $book_name = $book.attr('name');
      //화면에 출력
      $('div#random').addClass('show');
      $('div#random_title').html(
        '<a id="random_a" href="javascript:random_trigger(p_book,p_chapter,p_verse);">' +
          $book_name +
          ' ' +
          p_chapter +
          '장 ' +
          p_verse +
          '절</a>'
      );
      $('div#random_verse').html(
        $book
          .find('v')
          .eq(p_verse - 1)
          .text()
      );
    },
    error: function () {
      highlightVerse();
    },
  });
}
