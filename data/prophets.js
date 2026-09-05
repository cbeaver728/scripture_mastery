/* Scripture Mastery — latter-day prophets.
   PROPHETS is the succession, used for the answer choices; o = order in the
   succession, which is how "nearby" wrong answers are picked.
   PROPHET_QUOTES: p = who said it, d = difficulty, q = the quote, src = where
   it is from, u = a page on churchofjesuschrist.org containing it.
   Every quote here has been checked against its page by tools/verify-quotes.js.
   Do not add one that has not. */
window.PROPHETS = [
{n:"Joseph Smith",o:1,y:"1830–1844"},
{n:"Brigham Young",o:2,y:"1847–1877"},
{n:"John Taylor",o:3,y:"1880–1887"},
{n:"Wilford Woodruff",o:4,y:"1889–1898"},
{n:"Lorenzo Snow",o:5,y:"1898–1901"},
{n:"Joseph F. Smith",o:6,y:"1901–1918"},
{n:"Heber J. Grant",o:7,y:"1918–1945"},
{n:"George Albert Smith",o:8,y:"1945–1951"},
{n:"David O. McKay",o:9,y:"1951–1970"},
{n:"Joseph Fielding Smith",o:10,y:"1970–1972"},
{n:"Harold B. Lee",o:11,y:"1972–1973"},
{n:"Spencer W. Kimball",o:12,y:"1973–1985"},
{n:"Ezra Taft Benson",o:13,y:"1985–1994"},
{n:"Howard W. Hunter",o:14,y:"1994–1995"},
{n:"Gordon B. Hinckley",o:15,y:"1995–2008"},
{n:"Thomas S. Monson",o:16,y:"2008–2018"},
{n:"Russell M. Nelson",o:17,y:"2018–2025"},
{n:"Dallin H. Oaks",o:18,y:"2025–"}
];

var M = "https://www.churchofjesuschrist.org/study/manual/";
var C = "https://www.churchofjesuschrist.org/study/general-conference/";

window.PROPHET_QUOTES = [
/* ---- Joseph Smith ---- */
{p:"Joseph Smith",d:1,q:"The Standard of Truth has been erected; no unhallowed hand can stop the work from progressing; persecutions may rage, mobs may combine, armies may assemble, calumny may defame, but the truth of God will go forth boldly, nobly, and independent.",src:"Wentworth Letter, 1842",u:M+"teachings-joseph-smith/chapter-11?lang=eng"},
{p:"Joseph Smith",d:1,q:"I teach them correct principles, and they govern themselves.",src:"On governing the Saints, 1843",u:M+"teachings-joseph-smith/chapter-24?lang=eng"},
{p:"Joseph Smith",d:2,q:"Friendship is one of the grand fundamental principles of “Mormonism”.",src:"Discourse, 1843",u:M+"teachings-joseph-smith/chapter-40?lang=eng"},
{p:"Joseph Smith",d:2,q:"A man filled with the love of God, is not content with blessing his family alone, but ranges through the whole world, anxious to bless the whole human race.",src:"Discourse, 1839",u:M+"teachings-joseph-smith/chapter-28?lang=eng"},

/* ---- Brigham Young ---- */
{p:"Brigham Young",d:2,q:"I feel like shouting hallelujah, all the time, when I think that I ever knew Joseph Smith.",src:"Discourse, 1859",u:M+"teachings-brigham-young/chapter-14?lang=eng"},
{p:"Brigham Young",d:2,q:"This is the place.",src:"On entering the Salt Lake Valley, 1847",u:M+"teachings-brigham-young/chapter-6?lang=eng"},

/* ---- Wilford Woodruff ---- */
{p:"Wilford Woodruff",d:1,q:"The Lord will never permit me or any other man who stands as President of this Church to lead you astray. It is not in the programme. It is not in the mind of God.",src:"Official Declaration 1, Excerpts",u:"https://www.churchofjesuschrist.org/study/scriptures/dc-testament/od/1?lang=eng"},

/* ---- Lorenzo Snow ---- */
{p:"Lorenzo Snow",d:1,q:"As man now is, God once was; as God now is, man may be.",src:"Couplet received by revelation, 1840",u:M+"gospel-topics-essays/becoming-like-god?lang=eng"},

/* ---- Joseph F. Smith ---- */
{p:"Joseph F. Smith",d:2,q:"The eyes of my understanding were opened, and the Spirit of the Lord rested upon me, and I saw the hosts of the dead, both small and great.",src:"Vision of the Redemption of the Dead, D&C 138:11",u:"https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/138?lang=eng"},

/* ---- Heber J. Grant ---- */
{p:"Heber J. Grant",d:2,q:"That which we persist in doing becomes easier for us to do; not that the nature of the thing is changed, but that our power to do is increased.",src:"A favorite saying, sometimes attributed to Ralph Waldo Emerson",u:M+"teachings-heber-j-grant/chapter-4?lang=eng"},

/* ---- George Albert Smith ---- */
{p:"George Albert Smith",d:2,q:"There is a line of demarcation, well defined, between the Lord’s territory and the devil’s territory.",src:"Counsel from his grandfather, often repeated",u:M+"teachings-george-albert-smith/chapter-18?lang=eng"},
{p:"George Albert Smith",d:3,q:"I would be a friend to the friendless and find joy in ministering to the needs of the poor.",src:"From his personal creed",u:M+"teachings-george-albert-smith/chapter-1?lang=eng"},

/* ---- David O. McKay ---- */
{p:"David O. McKay",d:1,q:"No other success can compensate for failure in the home.",src:"Quoting J. E. McCulloch; general conference, 1935",u:M+"teachings-david-o-mckay/the-life-and-ministry-of-david-o-mckay?lang=eng"},
{p:"David O. McKay",d:1,q:"Every member a missionary.",src:"General conference, 1959",u:M+"teachings-david-o-mckay/title-page?lang=eng"},
{p:"David O. McKay",d:2,q:"Next to the bestowal of life itself, the right to direct that life is God’s greatest gift to man.",src:"On agency; quoted by President Monson, October 2010",u:C+"2010/10/the-three-rs-of-choice?lang=eng"},

/* ---- Harold B. Lee ---- */
{p:"Harold B. Lee",d:1,q:"The most important of the Lord’s work you will ever do will be within the walls of your own homes.",src:"Strengthening the Home, 1973",u:M+"teachings-harold-b-lee/chapter-14?lang=eng"},

/* ---- Spencer W. Kimball ---- */
{p:"Spencer W. Kimball",d:1,q:"God does notice us, and he watches over us. But it is usually through another person that he meets our needs.",src:"Small Acts of Service, Ensign, December 1974",u:"https://www.churchofjesuschrist.org/study/ensign/1974/12/small-acts-of-service?lang=eng"},
{p:"Spencer W. Kimball",d:2,q:"Are we prepared to lengthen our stride? To enlarge our vision?",src:"To mission representatives, 1974",u:M+"teachings-spencer-w-kimball/the-life-and-ministry-of-spencer-w-kimball?lang=eng"},

/* ---- Ezra Taft Benson ---- */
{p:"Ezra Taft Benson",d:1,q:"Pride is the universal sin, the great vice.",src:"Beware of Pride, April 1989",u:C+"1989/04/beware-of-pride?lang=eng"},
{p:"Ezra Taft Benson",d:1,q:"The central feature of pride is enmity—enmity toward God and enmity toward our fellowmen.",src:"Beware of Pride, April 1989",u:C+"1989/04/beware-of-pride?lang=eng"},
{p:"Ezra Taft Benson",d:1,q:"We must flood the earth with the Book of Mormon.",src:"Flooding the Earth with the Book of Mormon, November 1988",u:"https://www.churchofjesuschrist.org/study/ensign/1988/11/flooding-the-earth-with-the-book-of-mormon?lang=eng"},

/* ---- Howard W. Hunter ---- */
{p:"Howard W. Hunter",d:2,q:"I bless you with an increased desire to be worthy of a temple recommend and to attend the temple as frequently as circumstances allow.",src:"Follow the Son of God, October 1994",u:C+"1994/10/follow-the-son-of-god?lang=eng"},

/* ---- Gordon B. Hinckley ---- */
{p:"Gordon B. Hinckley",d:1,q:"Be grateful, be smart, be clean, be true, be humble, be prayerful.",src:"A Prophet’s Counsel and Prayer for Youth, January 2001",u:"https://www.churchofjesuschrist.org/study/ensign/2001/01/a-prophets-counsel-and-prayer-for-youth?lang=eng"},

/* ---- Thomas S. Monson ---- */
{p:"Thomas S. Monson",d:2,q:"I am so grateful to a loving Heavenly Father for His gift of agency, or the right to choose.",src:"The Three Rs of Choice, October 2010",u:C+"2010/10/the-three-rs-of-choice?lang=eng"},

/* ---- Russell M. Nelson ---- */
{p:"Russell M. Nelson",d:1,q:"Are you willing to let God prevail in your life? Are you willing to let God be the most important influence in your life?",src:"Let God Prevail, October 2020",u:C+"2020/10/46nelson?lang=eng"},
{p:"Russell M. Nelson",d:1,q:"Think celestial!",src:"Think Celestial!, October 2023",u:C+"2023/10/51nelson?lang=eng"},
{p:"Russell M. Nelson",d:1,q:"In coming days, it will not be possible to survive spiritually without the guiding, directing, comforting, and constant influence of the Holy Ghost.",src:"Revelation for the Church, Revelation for Our Lives, April 2018",u:C+"2018/04/revelation-for-the-church-revelation-for-our-lives?lang=eng"},

/* ---- Dallin H. Oaks ---- */
{p:"Dallin H. Oaks",d:1,q:"We have to forego some good things in order to choose others that are better or best because they develop faith in the Lord Jesus Christ and strengthen our families.",src:"Good, Better, Best, October 2007",u:C+"2007/10/good-better-best?lang=eng"},
{p:"Dallin H. Oaks",d:1,q:"Just because something is good is not a sufficient reason for doing it.",src:"Good, Better, Best, October 2007",u:C+"2007/10/good-better-best?lang=eng"},
{p:"Dallin H. Oaks",d:2,q:"Desires dictate our priorities, priorities shape our choices, and choices determine our actions.",src:"Desire, April 2011",u:C+"2011/04/desire?lang=eng"},
{p:"Dallin H. Oaks",d:2,q:"The Final Judgment is not just an evaluation of a sum total of good and evil acts—what we have done. It is an acknowledgment of the final effect of our acts and thoughts—what we have become.",src:"The Challenge to Become, October 2000",u:C+"2000/10/the-challenge-to-become?lang=eng"}
];
