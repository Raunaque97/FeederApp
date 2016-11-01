//
// CalendarView (for Prototype)
// calendarview.org
//
// Maintained by Justin Mecham <justin@aspect.net>
//
// Portions Copyright 2002-2005 Mihai Bazon
//
// This calendar is based very loosely on the Dynarch Calendar in that it was
// used as a base, but completely gutted and more or less rewritten in place
// to use the Prototype JavaScript library.
//
// As such, CalendarView is licensed under the terms of the GNU Lesser General
// Public License (LGPL). More information on the Dynarch Calendar can be
// found at:
//
//   www.dynarch.com/projects/calendar
//

var Calendar = Class.create()

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

Calendar.VERSION = '1.2'

Calendar.DAY_NAMES = new Array(
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  'Sunday'
)

Calendar.SHORT_DAY_NAMES = new Array(
  'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'
)

Calendar.MONTH_NAMES = new Array(
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
)

Calendar.SHORT_MONTH_NAMES = new Array(
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
  'Dec' 
)

Calendar.NAV_PREVIOUS_YEAR  = -2
Calendar.NAV_PREVIOUS_MONTH = -1
Calendar.NAV_TODAY          =  0
Calendar.NAV_NEXT_MONTH     =  1
Calendar.NAV_NEXT_YEAR      =  2

//------------------------------------------------------------------------------
// Static Methods
//------------------------------------------------------------------------------

// This gets called when the user presses a mouse button anywhere in the
// document, if the calendar is shown. If the click was outside the open
// calendar this function closes it.
Calendar._checkCalendar = function(event) {
  if (!window._popupCalendar)
    return false
  if (Element.descendantOf(Event.element(event), window._popupCalendar.container))
    return
  window._popupCalendar.callCloseHandler()
  return Event.stop(event)
}

//------------------------------------------------------------------------------
// Event Handlers
//------------------------------------------------------------------------------

Calendar.handleMouseDownEvent = function(event)
{
  Event.observe(document, 'mouseup', Calendar.handleMouseUpEvent)
  Event.stop(event)
}

// XXX I am not happy with how clicks of different actions are handled. Need to
// clean this up!
Calendar.handleMouseUpEvent = function(event)
{
  var el        = Event.element(event)
  var calendar  = el.calendar
  var isNewDate = false

  // If the element that was clicked on does not have an associated Calendar
  // object, return as we have nothing to do.
  if (!calendar) return false

  // Clicked on a day
  if (typeof el.navAction == 'undefined')
  {
    if (calendar.currentDateElement) {
      Element.removeClassName(calendar.currentDateElement, 'selected')
      Element.addClassName(el, 'selected')
      calendar.shouldClose = (calendar.currentDateElement == el)
      if (!calendar.shouldClose) calendar.currentDateElement = el
    }
    calendar.date.setDateOnly(el.date)
    isNewDate = true
    calendar.shouldClose = !el.hasClassName('otherDay')
    var isOtherMonth     = !calendar.shouldClose
    if (isOtherMonth) calendar.update(calendar.date)
  }

  // Clicked on an action button
  else
  {
    var date = new Date(calendar.date)

    if (el.navAction == Calendar.NAV_TODAY)
      date.setDateOnly(new Date())

    var year = date.getFullYear()
    var mon = date.getMonth()
    function setMonth(m) {
      var day = date.getDate()
      var max = date.getMonthDays(m)
      if (day > max) date.setDate(max)
      date.setMonth(m)
    }
    switch (el.navAction) {

      // Previous Year
      case Calendar.NAV_PREVIOUS_YEAR:
        if (year > calendar.minYear)
          date.setFullYear(year - 1)
        break

      // Previous Month
      case Calendar.NAV_PREVIOUS_MONTH:
        if (mon > 0) {
          setMonth(mon - 1)
        }
        else if (year-- > calendar.minYear) {
          date.setFullYear(year)
          setMonth(11)
        }
        break

      // Today
      case Calendar.NAV_TODAY:
        break

      // Next Month
      case Calendar.NAV_NEXT_MONTH:
        if (mon < 11) {
          setMonth(mon + 1)
        }
        else if (year < calendar.maxYear) {
          date.setFullYear(year + 1)
          setMonth(0)
        }
        break

      // Next Year
      case Calendar.NAV_NEXT_YEAR:
        if (year < calendar.maxYear)
          date.setFullYear(year + 1)
        break

    }

    if (!date.equalsTo(calendar.date)) {
      calendar.setDate(date)
      isNewDate = true
    } else if (el.navAction == 0) {
      isNewDate = (calendar.shouldClose = true)
    }
  }

  if (isNewDate) event && calendar.callSelectHandler()
  if (calendar.shouldClose) event && calendar.callCloseHandler()

  Event.stopObserving(document, 'mouseup', Calendar.handleMouseUpEvent)

  return Event.stop(event)
}

Calendar.defaultSelectHandler = function(calendar)
{
  if (!calendar.dateField) return false

  // Update dateField value
  if (calendar.dateField.tagName == 'DIV')
    Element.update(calendar.dateField, calendar.date.print(calendar.dateFormat))
  else if (calendar.dateField.tagName == 'INPUT') {
    calendar.dateField.value = calendar.date.print(calendar.dateFormat) }

  // Trigger the onchange callback on the dateField, if one has been defined
  if (typeof calendar.dateField.onchange == 'function')
    calendar.dateField.onchange()

  // Call the close handler, if necessary
  if (calendar.shouldClose) calendar.callCloseHandler()
}

Calendar.defaultCloseHandler = function(calendar)
{
  calendar.hide()
}


//------------------------------------------------------------------------------
// Calendar Setup
//------------------------------------------------------------------------------

Calendar.setup = function(params)
{

  function param_default(name, def) {
    if (!params[name]) params[name] = def
  }

  param_default('dateField', null)
  param_default('triggerElement', null)
  param_default('parentElement', null)
  param_default('selectHandler',  null)
  param_default('closeHandler', null)

  // In-Page Calendar
  if (params.parentElement)
  {
    var calendar = new Calendar(params.parentElement)
    calendar.setSelectHandler(params.selectHandler || Calendar.defaultSelectHandler)
    if (params.dateFormat)
      calendar.setDateFormat(params.dateFormat)
    if (params.dateField) {
      calendar.setDateField(params.dateField)
      calendar.parseDate(calendar.dateField.innerHTML || calendar.dateField.value)
    }
    calendar.show()
    return calendar
  }

  // Popup Calendars
  //
  // XXX There is significant optimization to be had here by creating the
  // calendar and storing it on the page, but then you will have issues with
  // multiple calendars on the same page.
  else
  {
    var triggerElement = $(params.triggerElement || params.dateField)
    triggerElement.onclick = function() {
      var calendar = new Calendar()
      calendar.setSelectHandler(params.selectHandler || Calendar.defaultSelectHandler)
      calendar.setCloseHandler(params.closeHandler || Calendar.defaultCloseHandler)
      if (params.dateFormat)
        calendar.setDateFormat(params.dateFormat)
      if (params.dateField) {
        calendar.setDateField(params.dateField)
        calendar.parseDate(calendar.dateField.innerHTML || calendar.dateField.value)
      }
      if (params.dateField)
        Date.parseDate(calendar.dateField.value || calendar.dateField.innerHTML, calendar.dateFormat)
      calendar.showAtElement(triggerElement)
      return calendar
    }
  }

}



//------------------------------------------------------------------------------
// Calendar Instance
//------------------------------------------------------------------------------

Calendar.prototype = {

  // The HTML Container Element
  container: null,

  // Callbacks
  selectHandler: null,
  closeHandler: null,

  // Configuration
  minYear: 1900,
  maxYear: 2100,
  dateFormat: '%Y-%m-%d',

  // Dates
  date: new Date(),
  currentDateElement: null,

  // Status
  shouldClose: false,
  isPopup: true,

  dateField: null,


  //----------------------------------------------------------------------------
  // Initialize
  //----------------------------------------------------------------------------

  initialize: function(parent)
  {
    if (parent)
      this.create($(parent))
    else
      this.create()
  },



  //----------------------------------------------------------------------------
  // Update / (Re)initialize Calendar
  //----------------------------------------------------------------------------

  update: function(date)
  {
    var calendar   = this
    var today      = new Date()
    var thisYear   = today.getFullYear()
    var thisMonth  = today.getMonth()
    var thisDay    = today.getDate()
    var month      = date.getMonth();
    var dayOfMonth = date.getDate();

    // Ensure date is within the defined range
    if (date.getFullYear() < this.minYear)
      date.setFullYear(this.minYear)
    else if (date.getFullYear() > this.maxYear)
      date.setFullYear(this.maxYear)

    this.date = new Date(date)

    // Calculate the first day to display (including the previous month)
    date.setDate(1)
    date.setDate(-(date.getDay()) + 1)

    // Fill in the days of the month
    Element.getElementsBySelector(this.container, 'tbody tr').each(
      function(row, i) {
        var rowHasDays = false
        row.immediateDescendants().each(
          function(cell, j) {
            var day            = date.getDate()
            var dayOfWeek      = date.getDay()
            var isCurrentMonth = (date.getMonth() == month)

            // Reset classes on the cell
            cell.className = ''
            cell.date = new Date(date)
            cell.update(day)

            // Account for days of the month other than the current month
            if (!isCurrentMonth)
              cell.addClassName('otherDay')
            else
              rowHasDays = true

            // Ensure the current day is selected
            if (isCurrentMonth && day == dayOfMonth) {
              cell.addClassName('selected')
              calendar.currentDateElement = cell
            }

            // Today
            if (date.getFullYear() == thisYear && date.getMonth() == thisMonth && day == thisDay)
              cell.addClassName('today')

            // Weekend
            if ([0, 6].indexOf(dayOfWeek) != -1)
              cell.addClassName('weekend')

            // Set the date to tommorrow
            date.setDate(day + 1)
          }
        )
        // Hide the extra row if it contains only days from another month
        !rowHasDays ? row.hide() : row.show()
      }
    )

    this.container.getElementsBySelector('td.title')[0].update(
      Calendar.MONTH_NAMES[month] + ' ' + this.date.getFullYear()
    )
  },



  //----------------------------------------------------------------------------
  // Create/Draw the Calendar HTML Elements
  //----------------------------------------------------------------------------

  create: function(parent)
  {

    // If no parent was specified, assume that we are creating a popup calendar.
    if (!parent) {
      parent = document.getElementsByTagName('body')[0]
      this.isPopup = true
    } else {
      this.isPopup = false
    }

    // Calendar Table
    var table = new Element('table')

    // Calendar Header
    var thead = new Element('thead')
    table.appendChild(thead)

    // Title Placeholder
    var row  = new Element('tr')
    var cell = new Element('td', { colSpan: 7 } )
    cell.addClassName('title')
    row.appendChild(cell)
    thead.appendChild(row)

    // Calendar Navigation
    row = new Element('tr')
    this._drawButtonCell(row, '&#x00ab;', 1, Calendar.NAV_PREVIOUS_YEAR)
    this._drawButtonCell(row, '&#x2039;', 1, Calendar.NAV_PREVIOUS_MONTH)
    this._drawButtonCell(row, 'Today',    3, Calendar.NAV_TODAY)
    this._drawButtonCell(row, '&#x203a;', 1, Calendar.NAV_NEXT_MONTH)
    this._drawButtonCell(row, '&#x00bb;', 1, Calendar.NAV_NEXT_YEAR)
    thead.appendChild(row)

    // Day Names
    row = new Element('tr')
    for (var i = 0; i < 7; ++i) {
      cell = new Element('th').update(Calendar.SHORT_DAY_NAMES[i])
      if (i == 0 || i == 6)
        cell.addClassName('weekend')
      row.appendChild(cell)
    }
    thead.appendChild(row)

    // Calendar Days
    var tbody = table.appendChild(new Element('tbody'))
    for (i = 6; i > 0; --i) {
      row = tbody.appendChild(new Element('tr'))
      row.addClassName('days')
      for (var j = 7; j > 0; --j) {
        cell = row.appendChild(new Element('td'))
        cell.calendar = this
      }
    }

    // Calendar Container (div)
    this.container = new Element('div')
    this.container.addClassName('calendar')
    if (this.isPopup) {
      this.container.setStyle({ position: 'absolute', display: 'none' })
      this.container.addClassName('popup')
    }
    this.container.appendChild(table)

    // Initialize Calendar
    this.update(this.date)

    // Observe the container for mousedown events
    Event.observe(this.container, 'mousedown', Calendar.handleMouseDownEvent)

    // Append to parent element
    parent.appendChild(this.container)

  },

  _drawButtonCell: function(parent, text, colSpan, navAction)
  {
    var cell          = new Element('td')
    if (colSpan > 1) cell.colSpan = colSpan
    cell.className    = 'button'
    cell.calendar     = this
    cell.navAction    = navAction
    cell.innerHTML    = text
    cell.unselectable = 'on' // IE
    parent.appendChild(cell)
    return cell
  },



  //------------------------------------------------------------------------------
  // Callbacks
  //------------------------------------------------------------------------------

  // Calls the Select Handler (if defined)
  callSelectHandler: function()
  {
    if (this.selectHandler)
      this.selectHandler(this, this.date.print(this.dateFormat))
  },

  // Calls the Close Handler (if defined)
  callCloseHandler: function()
  {
    if (this.closeHandler)
      this.closeHandler(this)
  },



  //------------------------------------------------------------------------------
  // Calendar Display Functions
  //------------------------------------------------------------------------------

  // Shows the Calendar
  show: function()
  {
    this.container.show()
    if (this.isPopup) {
      window._popupCalendar = this
      Event.observe(document, 'mousedown', Calendar._checkCalendar)
    }
  },

  // Shows the calendar at the given absolute position
  showAt: function (x, y)
  {
    this.container.setStyle({ left: x + 'px', top: y + 'px' })
    this.show()
  },

  // Shows the Calendar at the coordinates of the provided element
  showAtElement: function(element)
  {
    var pos = Position.cumulativeOffset(element)
    this.showAt(pos[0], pos[1])
  },

  // Hides the Calendar
  hide: function()
  {
    if (this.isPopup)
      Event.stopObserving(document, 'mousedown', Calendar._checkCalendar)
    this.container.hide()
  },



  //------------------------------------------------------------------------------
  // Miscellaneous
  //------------------------------------------------------------------------------

  // Tries to identify the date represented in a string.  If successful it also
  // calls this.setDate which moves the calendar to the given date.
  parseDate: function(str, format)
  {
    if (!format)
      format = this.dateFormat
    this.setDate(Date.parseDate(str, format))
  },



  //------------------------------------------------------------------------------
  // Getters/Setters
  //------------------------------------------------------------------------------

  setSelectHandler: function(selectHandler)
  {
    this.selectHandler = selectHandler
  },

  setCloseHandler: function(closeHandler)
  {
    this.closeHandler = closeHandler
  },

  setDate: function(date)
  {
    if (!date.equalsTo(this.date))
      this.update(date)
  },

  setDateFormat: function(format)
  {
    this.dateFormat = format
  },

  setDateField: function(field)
  {
    this.dateField = $(field)
  },

  setRange: function(minYear, maxYear)
  {
    this.minYear = minYear
    this.maxYear = maxYear
  }

}

// global object that remembers the calendar
window._popupCalendar = null





























//==============================================================================
//
// Date Object Patches
//
// This is pretty much untouched from the original. I really would like to get
// rid of these patches if at all possible and find a cleaner way of
// accomplishing the same things. It's a shame Prototype doesn't extend Date at
// all.
//
//==============================================================================

Date.DAYS_IN_MONTH = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
Date.SECOND        = 1000 /* milliseconds */
Date.MINUTE        = 60 * Date.SECOND
Date.HOUR          = 60 * Date.MINUTE
Date.DAY           = 24 * Date.HOUR
Date.WEEK          =  7 * Date.DAY

// Parses Date
Date.parseDate = function(str, fmt) {
  var today = new Date();
  var y     = 0;
  var m     = -1;
  var d     = 0;
  var a     = str.split(/\W+/);
  var b     = fmt.match(/%./g);
  var i     = 0, j = 0;
  var hr    = 0;
  var min   = 0;

  for (i = 0; i < a.length; ++i) {
    if (!a[i]) continue;
    switch (b[i]) {
      case "%d":
      case "%e":
        d = parseInt(a[i], 10);
        break;
      case "%m":
        m = parseInt(a[i], 10) - 1;
        break;
      case "%Y":
      case "%y":
        y = parseInt(a[i], 10);
        (y < 100) && (y += (y > 29) ? 1900 : 2000);
        break;
      case "%b":
      case "%B":
        for (j = 0; j < 12; ++j) {
          if (Calendar.MONTH_NAMES[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) {
            m = j;
            break;
          }
        }
        break;
      case "%H":
      case "%I":
      case "%k":
      case "%l":
        hr = parseInt(a[i], 10);
        break;
      case "%P":
      case "%p":
        if (/pm/i.test(a[i]) && hr < 12)
          hr += 12;
        else if (/am/i.test(a[i]) && hr >= 12)
          hr -= 12;
        break;
      case "%M":
        min = parseInt(a[i], 10);
        break;
    }
  }
  if (isNaN(y)) y = today.getFullYear();
  if (isNaN(m)) m = today.getMonth();
  if (isNaN(d)) d = today.getDate();
  if (isNaN(hr)) hr = today.getHours();
  if (isNaN(min)) min = today.getMinutes();
  if (y != 0 && m != -1 && d != 0)
    return new Date(y, m, d, hr, min, 0);
  y = 0; m = -1; d = 0;
  for (i = 0; i < a.length; ++i) {
    if (a[i].search(/[a-zA-Z]+/) != -1) {
      var t = -1;
      for (j = 0; j < 12; ++j) {
        if (Calendar.MONTH_NAMES[j].substr(0, a[i].length).toLowerCase() == a[i].toLowerCase()) { t = j; break; }
      }
      if (t != -1) {
        if (m != -1) {
          d = m+1;
        }
        m = t;
      }
    } else if (parseInt(a[i], 10) <= 12 && m == -1) {
      m = a[i]-1;
    } else if (parseInt(a[i], 10) > 31 && y == 0) {
      y = parseInt(a[i], 10);
      (y < 100) && (y += (y > 29) ? 1900 : 2000);
    } else if (d == 0) {
      d = a[i];
    }
  }
  if (y == 0)
    y = today.getFullYear();
  if (m != -1 && d != 0)
    return new Date(y, m, d, hr, min, 0);
  return today;
};

// Returns the number of days in the current month
Date.prototype.getMonthDays = function(month) {
  var year = this.getFullYear()
  if (typeof month == "undefined")
    month = this.getMonth()
  if (((0 == (year % 4)) && ( (0 != (year % 100)) || (0 == (year % 400)))) && month == 1)
    return 29
  else
    return Date.DAYS_IN_MONTH[month]
};

// Returns the number of day in the year
Date.prototype.getDayOfYear = function() {
  var now = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
  var then = new Date(this.getFullYear(), 0, 0, 0, 0, 0);
  var time = now - then;
  return Math.floor(time / Date.DAY);
};

/** Returns the number of the week in year, as defined in ISO 8601. */
Date.prototype.getWeekNumber = function() {
  var d = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
  var DoW = d.getDay();
  d.setDate(d.getDate() - (DoW + 6) % 7 + 3); // Nearest Thu
  var ms = d.valueOf(); // GMT
  d.setMonth(0);
  d.setDate(4); // Thu in Week 1
  return Math.round((ms - d.valueOf()) / (7 * 864e5)) + 1;
};

/** Checks date and time equality */
Date.prototype.equalsTo = function(date) {
  return ((this.getFullYear() == date.getFullYear()) &&
   (this.getMonth() == date.getMonth()) &&
   (this.getDate() == date.getDate()) &&
   (this.getHours() == date.getHours()) &&
   (this.getMinutes() == date.getMinutes()));
};

/** Set only the year, month, date parts (keep existing time) */
Date.prototype.setDateOnly = function(date) {
  var tmp = new Date(date);
  this.setDate(1);
  this.setFullYear(tmp.getFullYear());
  this.setMonth(tmp.getMonth());
  this.setDate(tmp.getDate());
};

/** Prints the date in a string according to the given format. */
Date.prototype.print = function (str) {
  var m = this.getMonth();
  var d = this.getDate();
  var y = this.getFullYear();
  var wn = this.getWeekNumber();
  var w = this.getDay();
  var s = {};
  var hr = this.getHours();
  var pm = (hr >= 12);
  var ir = (pm) ? (hr - 12) : hr;
  var dy = this.getDayOfYear();
  if (ir == 0)
    ir = 12;
  var min = this.getMinutes();
  var sec = this.getSeconds();
  s["%a"] = Calendar.SHORT_DAY_NAMES[w]; // abbreviated weekday name [FIXME: I18N]
  s["%A"] = Calendar.DAY_NAMES[w]; // full weekday name
  s["%b"] = Calendar.SHORT_MONTH_NAMES[m]; // abbreviated month name [FIXME: I18N]
  s["%B"] = Calendar.MONTH_NAMES[m]; // full month name
  // FIXME: %c : preferred date and time representation for the current locale
  s["%C"] = 1 + Math.floor(y / 100); // the century number
  s["%d"] = (d < 10) ? ("0" + d) : d; // the day of the month (range 01 to 31)
  s["%e"] = d; // the day of the month (range 1 to 31)
  // FIXME: %D : american date style: %m/%d/%y
  // FIXME: %E, %F, %G, %g, %h (man strftime)
  s["%H"] = (hr < 10) ? ("0" + hr) : hr; // hour, range 00 to 23 (24h format)
  s["%I"] = (ir < 10) ? ("0" + ir) : ir; // hour, range 01 to 12 (12h format)
  s["%j"] = (dy < 100) ? ((dy < 10) ? ("00" + dy) : ("0" + dy)) : dy; // day of the year (range 001 to 366)
  s["%k"] = hr;   // hour, range 0 to 23 (24h format)
  s["%l"] = ir;   // hour, range 1 to 12 (12h format)
  s["%m"] = (m < 9) ? ("0" + (1+m)) : (1+m); // month, range 01 to 12
  s["%M"] = (min < 10) ? ("0" + min) : min; // minute, range 00 to 59
  s["%n"] = "\n";   // a newline character
  s["%p"] = pm ? "PM" : "AM";
  s["%P"] = pm ? "pm" : "am";
  // FIXME: %r : the time in am/pm notation %I:%M:%S %p
  // FIXME: %R : the time in 24-hour notation %H:%M
  s["%s"] = Math.floor(this.getTime() / 1000);
  s["%S"] = (sec < 10) ? ("0" + sec) : sec; // seconds, range 00 to 59
  s["%t"] = "\t";   // a tab character
  // FIXME: %T : the time in 24-hour notation (%H:%M:%S)
  s["%U"] = s["%W"] = s["%V"] = (wn < 10) ? ("0" + wn) : wn;
  s["%u"] = w + 1;  // the day of the week (range 1 to 7, 1 = MON)
  s["%w"] = w;    // the day of the week (range 0 to 6, 0 = SUN)
  // FIXME: %x : preferred date representation for the current locale without the time
  // FIXME: %X : preferred time representation for the current locale without the date
  s["%y"] = ('' + y).substr(2, 2); // year without the century (range 00 to 99)
  s["%Y"] = y;    // year with the century
  s["%%"] = "%";    // a literal '%' character

  return str.gsub(/%./, function(match) { return s[match] || match });
};

Date.prototype.__msh_oldSetFullYear = Date.prototype.setFullYear;
Date.prototype.setFullYear = function(y) {
  var d = new Date(this);
  d.__msh_oldSetFullYear(y);
  if (d.getMonth() != this.getMonth())
    this.setDate(28);
  this.__msh_oldSetFullYear(y);
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         zǺ���ж����{�P34�L���r`e=�_Ȳ��2�:�<3n�>�P��]0X�-��`�}@���+��[�@2]d��xV���=�k,��������e��z����g���6��1��e���
ρ|��@-�A�s��)���s���s��չt6W+ք��x.n��е�Y�Z��|�������C�
<��V,ժkht�6��P��Vc�M��=�m��J�E��;���aē�k��eq&��.֠7�߂�T�-��֘��T�k�9�N��%��R�
E�z��~�B�R�V��X~u���YY5θ
��0�]M�'�|�
څK��4����M�D#��e��֝b7<-���Ut��J'���;r6;�B�����d�G���� �cv�?�l��[�$~�m ��z�Ԗ`\���B%�5�����O�e<���k�t��=��\>�0��F��.;�/5���ȇ�����x�:5{�썠�&P���c4ކ�_�޶����J���|�7�Q_<e�����y���]L��	�� ��4<��w���E7ޖV}�IZ�����V_	R���ݮ��.,���4H�v��Aj�Zv�"^��* :�}/h�[��?�ZzŎ&����}�O�y�z	�V�6�9:�JHq\4���&�
�8��A��O8��<7	t��a�:vq?�8� �,����.�5+�}���N�W�x��K��:���ڢ[Hb��A�s�CH�-X� VZ��zx�KP�~W�@s���Tm���z���tS�4n�G�bǝSξdk���~�=3�/26�m�0kT���X�Vf~L�lV]�A������9ŰYu��-���Z7��a,Ðn��#ôЇႻ�(w)��W�9^��JF�ծ�G�c�a�t3kl��f(�;���+U;��Qpx�6~%X��@��9��`�M����ɨǡ�_�;�EwR��w�Ǟm��rT\�4��6��_�`\ح��P�5{C�v@��z�2�:�� ��A��-�k�YҶ�)7O�v��_��ȯ��p�c�q4i�|�W8���u?�{��oǆ.�����l�)��lS�����*�8�� ��8El����V0�TW�o@`��rw�1�5�3?a�W�k�)��-�-.j��z�\� \s۠�b(�	��{,8���y�>�0�9�5=�<�8㜡ז�𱥰��(�1kkY�1p�g�~�zW�����D�Ö1�G�1f�yl��k��z�>Yʻ�n��?e��<��4��p�.���aJ�|�g�����Ȱ�3K�?��Lx��dSD���Q��:�ֆ&
��� �b��V����Xc���W�{NR��
��G;�+ (���	J��wB��5^���{�r��^����6���TBԵ{=1t|XCكp?,���|N����3��&�p�յ��7�oW����WY�&����h5.QԊj#�m��!
�z<kmW�$��6�\�.�]oQ��|-���嗌��S-k����7��$u��;�e��.�Q�JYЯ��JK����4J�9���J_�C_B'B_^��;���Z��08���f�96Z�z����YYoN�g���uc]$�,�Db��ԁ!�m	�]b�����1ݙ�:x'�b��Pn?[zJ\7�> ���m���r�A� ߲���`u���T���d4�\G�^_�o�ppiq���hph�[���#1UXb���T�r�@�D8�� ��#+��j�4�����š��
W Ѿ@[S���ƌ�aM�����4ʿ�i�rnj�p[��"`u�1��=�ZM�t���E0�<�/Mj\������!&�!�����*�|�����J61��4W\
V�w��po+X� �� �-v�ZQcL�T�b�W��Ü�e٭C�-�cҵm����W�X���wZ���c;zy�v�b��H�CX��Ф�<]FI���/)�>�yH`"��ô��ieY+��`�)�o���o,��Ŭ,�6��P���˺5K���x��z�P���A��Y%P�W�Tm�yA�Iq��x�9T���W�F=�{�<y=K�i�is-K�+�`wm��/��>l5�Zq��\oa�J�K�T\6*�:�.��/��݁� q~�TW*G�/Dբ�x-(�0WxgF�ͮ���_�;u�eA$u�;��+��5�S�1*��#����{����L���C�!My�Rq	g�9W��i�ݕ�>�5�⒫ 7.Bq�ư�t�ބ7*�mR*0'Me���Ł����#�_˕{�?���ۉ��׽��{@��eq�.�k��.�ʪ֖ĝm�b7c*�ݽ�r����j]$�gK�@�
�c筼�[QZ���� ����t���m���
��'{#I�^�v���J�LM�>�U1ɤ�!��$� �T{�12��?����#��\f7�}�P�C9��\���B��.�������P��]������Ia���z�$�F�ZT\��c��W�S1I~T�ֱ�}�6������J�i/_,=��]"O{h���{��M� �U��qtY�B��U�A!�[����N��(��JYVE[fp���*�\��]@w�:��q�i�DYj�	l��Lk���5���̮Tc�3i-����0݆|k`��+��j)g��q?egV`���|�nj��W�8�۬��k\eAf���zG�EI=�m��n�X��A���n
_ݜvf	���SgO��pF�8a��+�\C��Z#\ZS��јg<�W<�p�����|Ւ��㑊\�,'x-�S/�~CM���x<P��b�Gt�m߃U�3�-�ϋ_fm�r�򶝴(�����IO�bA&v��
s�#�)ܭ�_8�n�U���@l��F��۟F_�wN%��LS�jܴXd�ލ���v�`G�}�q�:��T�)��:վ�79�+ĺ���,����O�?Tw+��0��z?���up���t�v��� ����3�dvYLFU;�E<�2��ZTa��4h���1E�Vw&�v0�qH��Jq���M�~��ҵzVA���TTcm���.��)�1şP�	`��N�Y�݈���Da��Τj4Q_LL�k�=��%R�~�y&�Nᠬ���릶Ӫ�ӊ~���/�#h0K��sb{�i����QoS�eVSG�)��p+��V�Զ����ĸ�� ���v����A�����?p} �i@Dtw8����N��6A�}�&��/���Vu���'���i[۩M��u��k�]�N.A�ګ�v�=k��)��`�i�T(s*�b]j#wN�kA���k�9���U�������S��}��ٜ����.h�W�>�%�?{�����E����m�nzV։��K�ߜQC��5��:[i[+��4�mm���:cŁ0[��5��c�)�3-ZM|8��B�U�T���wδ>����15z�9�dS�G���z�m{,�ё�)o__/�z��#�J�G�����*�j�b9��;�3���	48W����]`� �}Z�b�cqy�"M/����6�/V�S����
wֿ���|<�v���<ؙ�qF<7�y]�Y�Ds����W��9]����>R{���#�O����<~{uz�����+��ƚh)U��_ ��أ�aw��}��"ޡ%�0'W�jn�Qִ}b�ƒ�v�w��I�ɠ:'1�	�����"3��o�A��n�/>�R�-mo�R6y��ā'���4mc����߫������S�_����j����T�����7vh��8K��"DKbbl/���o��G������z�ߏA	UFkka�g/s�v7ۻ�T�M[ɫ�"q6�G]T������6������?�܅��^����%���_���W+�|{�zܷ���!�ry����v��oO����/�ԛ��t��k��?�67�O�d��H�+;��s;���3h��1���a�~#�������n&�?�ʾ�{�!ދ��;�ƱÝ�z�k��j|��*��[E�����]��~�{p=�]��m�Z�����'n�/��׆�3No|�؀S�H|>��ld&���i9W�g7��3�3�jENe�v�|�8�l�~�n��t[e4��Ӵ�����_��ٵi�Z6�FI�iH:̯�8��"�{V+=�tg���#2MuF���u��	�.�3�[��괚,�l�8���d;Ncs8�!=?�o���z/\��	姶c+IN�̥�R��eu�Z�J�z�&�#��V�4��h��ϱQY��X�G�;� HQ�{�Auj�\�a%��' HY{+D���� &sGx0&��O�V��0h+Iۅ:�h���N�V֫ՇC�p�.�5X��q��j0.����˓Bb��`\6�Px+	��Y���q_������R���d�ze�����,�[�����{�A���5y[�/1I݋;��eӐSo 0v�G�sTgFX:>~��࿷���2|�Q��5ʽ��\�^t�[�x�&�b�C���
ɂ-����e�^ ����<'�go��CV�G1�c�_	��Х��W[}��z���=��_3M��m��J�`д_��`:�3M��VPp^q=(׆0�bΩ�)�]�O剽��ҵ-0[���Z=�撘����)]�����(V��!ݨ�xX:��o��_&:��*�2H���U������_SV��"�jR�zC@	��M���}��X�&���()�zŁ��'5�[.Ê�9�����rpG�(=�>
A��LK�Ģ5��Ί�5�(���V�G��`i%5���1p�z9͈zPL{���-4��l�Ta�i��S|�u+��o�[�õZX��n$��u0^�(x�~|}����5�c;^��b��^��`���]��t�x���,�h�
��>��RBY�n�mߨ����14����V�s���j�ı�8k��0���@;��X:f�=�K�����Rl�V17 ��Q,j3�.�
��:�t�]a�pM�*���5�����/B��#����U�Wq{�>7�D�8z7���
=l0+Kֹ;���X��Iܡ��73`"�V�nd��=){d�U�}+���(/}ۏ&�e��,�ԛ�u�V&uQ\�;4I�;�3�jyE� x46y�K��{SO*�&7`�}B.4EX�zK7�X�&��e.1*.5Q���i���Cq5�YϹ�J��hln}+����W���nW��.Iݭ�'ݩ8&yH�C�f����q��h�Q�Y�sG�-N���v|��ᮌʯ�V�o���1��1��}t�� z�&ck)�4І��*�z\�\�k]���J�e�����g:��+y6/�*�e�A5P�WT囔�i��6k�FB�x�|F��8�h������Cq�����C��uA��O頎�4gڑ��@=�Hk��s��v5��Y�Yw�w�Y�Ls�����L<�fZbw@P��YO�9hX%��˶)Vf;��s�����h�L�u+�c4���V9�2����7��b��)�fq�?�[h�cO��(v��p	�GT�3	j�,��l�:�"����D��y"?�Ec�����J�j*LǜA�}��5�4b+�kT�anhXk��f���T�$�o��rGG��TG#O�Dc�`7� 8f�s�;� ��-Z�).�ܯ�lY�{��l�E)�_p�J�LJ���jEm��A�(Z�)���%����./��o�ye#��S�r�D��-x����y�:ްeߢ�H��A�8����)��.[x��v�rگ7��z��7���:oJ#��y�f����)&p�$�9=��"����?Pu��l�c�p<8���j��c�Sϩ��Vww�܆�o�\)���#�]�.�8Dv�<��2����ϴ��w^��޽��}|9�i��'�Z�0{x�)�Kݪm�~�n���b=�j�@<o|��5�����>�ɇПE�}m',v~�kC�ڪo����-�y���.��gT0 �Pm똚Jg��J�!Y�cPۇ��?������y�|����?��9ֆ/��aE��m\j�bC�Ǝ����,�;��^��[��^��ﵯ���n*��F\2�M�~���ލ���B�Y�z�R�����Z�
�>�O�Qh�x�]Z�󄵓:�b��k�a����ٗ�9ٶ��>�	=χ:Ӫ��vZ�p%�b��yGU\�̟�=2�;ꌎ �R5n�ȫ�ɰ�@��O�?��iu{j� ,����"D�h��"`�r}D���*,<�J7��+.uT��H	���!W!sU��A�kqܳ���0b�:�f��F�QW��;M���A>;Z��4���|�TKt	��\#�\�T�ҟ_B���;e"�1�:�噿U��p5C�7k�[w!~��/���?W�Hb��Gi ��XSD��A#�Ε܉x�ǚ}�	�t��h�&p�g0�t�{�3�������G�9
C�G�oxd43��V������]���t�d���]p�}���D�u���������'���[�{��#{_=I�l�'�\��7���uF0n �L�F-A�9����K���摛F�\�G���`�����[ð�.P���b/�����Y��g�Z��ƈ5�-ٶż��#��ͅ���!�S�T�6T�*�)g��p��qI5�0U;��]�8:��rt"�b`|�<���.�9'�P����4��!��j�j=��j���N�^���F��Z��->J(��$J�v�F7���J���מ-��w�mN���%΃�hv��bG9�8� ːZk+a|KOrg/�O��`������W�^��Ѹ��i�.�p��s7=5�׭�B#�1X�ƨ��d8\�_jE��-�n����9��"�f=�
&c�j!:�>#<��\\qr�;��e(�1�?|�Y��[}uu���Ir��RB�R���0إe97��h���v|>^_R�/"�܁�v�?v!�Q���
�R�aeL= }wzM&�y|�b�����������`�p RHw���$�!<�����L�Xև4�0��c��>j�����P�3��q�b?y+��w�mJ�Y��U`a���ZacE��IEk���F���&���~ꌌ�;�?i��'�k�����@/��,���
��l�@�=_��f��~��/���;�x>,�W�!����+L�����>V��P���@�֜f"����2�����R��������omK:����xq��e�6���49��I�7�H�2�C���E�>�8�E��/ay�Au�+'H*��&�C}�~�A��$�g�x�����ǚ��բ�8���c"Y���>t'�,޻���Y�0������O���.��q!�B��1a�"V�0 A��<>������d���,�~Bq\�W���o�� ��z���6���|�VjsM0��ro�[��������
�j��喊U�UpU��'�� JY���LZ�'� �c�W���}�5������{�Vz�)z���,���Г��	�����~��7ެu����#x���Gۓ_,'��"��h�9"��;:��0�����n�g�1ѳ~.��x���S/y=;���܁���f�M8OB���vE8�[��s�.��v;����N��p�3E��`���M�`^���#.��|�P�[<�[�X��sL���� �~o��ƥ�X�ro��ha2���<�Ӹv���y�Q�0W6���҂+�Ju��>iF>ٖֈa"��aݧ�����3�I�i?��b��Y�??��OWG#SMS�DS����KVs����@8�}����պ��SB������+��ƺ��fv|��[�F�����X׆A`�+�Y�W�q�>�5��EĹ�M��A�����wWpS���� �N'Bk��Ɯ0r��=W�k�c5�4Gt·tt�6W�xk~�gƿ��)}�_d5��hcM,�X`��D�����&���+���B-�B7��j�.l8�56
گ&d�j�vY�v�RN��ԋgp�t�_���dU��/Qjh!݆���t�1����~S�#��wۨ��3�7�.���=b_"u�	e�wN 	�G�9DHA�V2LBjy���\�rO ��[�