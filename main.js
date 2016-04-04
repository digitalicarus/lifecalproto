(function () {
	var doc    = document
	,   body   = doc.body
	,   create = doc.createElement.bind(doc)
	,   currentMarkerType
	,   data
	,   dob
	;

	function fnTemplate (f) {
		return f.toString()
			.replace(/[^\/]*\/\*!/m,'')
			.replace(/\*\/(.|\s)*/m, '');
	}

	function asyncLoader (s, cb, bust) {
		var d  = document                                                                                                    
		,   h  = document.getElementsByTagName('head')[0]                                                                    
		,   b  = (Math.random()*1e8>>0)                                                                                      
		,   i  = 'loader_'+b                                                                                                 
		,   t  = (/\.js$/.test(s)) ? "js" : "css"                                                                            
		,   j  = (t === 'js') ? d.createElement('script') : d.createElement('link');                                         

		j.id = i;                                                                                                            

		if(t === "js"){                                                                                                      
			j.src = s+'?'+(bust?'b='+b:'');                                                                                            
			h.appendChild(j);                                                                                                

			j.onload = j.onreadystatechange = function() {                                                                   
				var r = this.readyState;                                                                                     
				if ((!r || r == "loaded" || r == "complete")) {                                                              
					// Handle memory leak in IE                                                                              
					j.onload = j.onreadystatechange = null;                                                                  
					h.removeChild( j );                                                                                      
					cb && typeof cb === 'function' && cb();                                                                  
				}                                                                                                            
			};                                                                                                               
		} else {                                                                                                             
			j.setAttribute("rel", "stylesheet");                                                                             
			j.setAttribute("type", "text/css");                                                                              
			j.setAttribute("href", s+'?'+'b='+b);                                                                            
			h.appendChild(j);                                                                                                

			//-- need poller here                                                                                            
			cb && typeof cb === 'function' && cb();                                                                          
		}                                                                                                                    
	}

	function updateCurrentWeek () {
		var cells = doc.querySelectorAll('.calendar .cell');

		Array.prototype.forEach.call(cells, function (cell) {
			cell.classList.remove('current-week');
		});
		
		var currentWeek = moment().diff(moment(dob.year+dob.month+dob.day, 'YYYYMMDD'), 'weeks')
		,   cell        = doc.querySelector('.calendar .cell[data-row="'+(currentWeek/52|0)+'"][data-col="'+currentWeek%52+'"]')
		;
		cell && cell.classList.add('current-week');
	}

	var tmplComponents = {
		headerTmpl: fnTemplate(function () {/*!
			<header>
				<h1>90 Years in Weeks</h1>
				<p>
					Mark each week of your life accordingly.<br/>
					Don't let more than 1 or 2 consecutive red or orange weeks go by!
				</p>
				<div class="dob-card">
					<form class="dob">
						<div class="dob-box">
							<label for="dob-month">Month</label> 
							<input name="dob-month" data-key="month" value="{{=it.dob.month}}" />
						</div>
						<div class="dob-box">
							<label for="dob-day">Day</label> 
							<input name="dob-day" data-key="day" value="{{=it.dob.day}}" />
						</div>
						<div class="dob-box">
							<label for="dob-year">Year</label> 
							<input name="dob-year" data-key="year" value="{{=it.dob.year}}" />
						</div>
					</form>
					<aside>Enter your date of birth to see the current week marked</aside>
				</div>
			</header>
		*/}),
		legendTmpl: fnTemplate(function () {/*!
			<fieldset class="marker-type-select">
				<legend>select one</legend>
				<ul class="legend noselect clearfix">
					<li class="green" data-marker-type="1">this is how I want to live!</li>
					<li class="orange" data-marker-type="2">okay,  but different decisions are in order going forward</li>
					<li class="red" data-marker-type="3">not okay - get angry - get motivated - make changes</li>
				</ul>
			</fieldset>
		*/}),
		calendarTmpl:  fnTemplate(function () {/*!
			<div class="calendar">
				{{~ new Array(91) :row:rowIdx }}
					<div class="row">
						{{?rowIdx%5===0}}<aside>{{=rowIdx}}</aside>{{?}}
						{{~ new Array(52) :col:colIdx }}
							<div class="cell" 
								data-row="{{=rowIdx}}"
								data-col="{{=colIdx}}"
								data-year="{{=rowIdx}}" 
								data-week="{{=colIdx+1}}"
								{{?it.data[rowIdx][colIdx]}}data-value="{{=it.data[rowIdx][colIdx]}}"{{?}}
								title="year {{=rowIdx}} week {{=colIdx+1}}" 
							>
								{{?rowIdx===0&&((colIdx+1)%5===0||colIdx===0)}}<aside>{{=colIdx+1}}</aside>{{?}}
								<button />
							</div>
						{{~}}
					</div>
				{{~}}
			</div>
		*/}),
		mainTmpl: fnTemplate(function () {/*!
			{{#def.headerTmpl}}
			{{#def.legendTmpl}}
			<div class="clearfix"></div>
			{{#def.calendarTmpl}}
		*/})
	};

	data = JSON.parse(localStorage.getItem('lifeCalendarData')) || (function () {
		var data = new Array(91), i = 0; // don't forget year 0
		for (; i < data.length; i++) {
			data[i] = new Array(52);
		}
		return data;
	})();

	dob = JSON.parse(localStorage.getItem('lifeCalendarDOB')) || { month: '', day: '', year: '' };

	asyncLoader('doT.min.js', function () {
		asyncLoader('moment.min.js', function () {
			body.innerHTML = doT.template(tmplComponents.mainTmpl, undefined, tmplComponents)({data: data, dob: dob});

			var legendEles = doc.querySelectorAll('.legend li')
			,   cells      = doc.querySelectorAll('.calendar .cell')
			,   dobInputs  = doc.querySelectorAll('form.dob input')
			;

			//-- attach events to legend selects
			Array.prototype.forEach.call(legendEles, function (li) {
				li.addEventListener('click', function (e) {
					var markerType = parseInt(this.getAttribute('data-marker-type'), 10);

					Array.prototype.forEach.call(legendEles, function (li) {
						li.classList.remove('selected');
					});
					if (markerType !== currentMarkerType) {
						this.classList.add('selected');
						currentMarkerType = markerType;
					} else {
						currentMarkerType = undefined;
					}
				});
			});

			//-- attach events to cells
			Array.prototype.forEach.call(cells, function (cell) {
				cell.addEventListener('click', function (e) {
					var row      = parseInt(this.getAttribute('data-row'), 10)
					,   col      = parseInt(this.getAttribute('data-col'), 10)
					,   cellData = parseInt(this.getAttribute('data-value'), 10)
					;

					if (currentMarkerType && cellData !== currentMarkerType) {
						data[row][col] = currentMarkerType;
						this.setAttribute('data-value', currentMarkerType);
					} else {
						data[row][col] = undefined
						this.removeAttribute('data-value');
					}
					localStorage.setItem('lifeCalendarData', JSON.stringify(data));
				});
			});

			//-- attach events to dob inputs
			Array.prototype.forEach.call(dobInputs, function (input) {
				input.addEventListener('keyup', function (e) {
					var key = this.getAttribute('data-key');
					dob[key] = this.value + '';
					localStorage.setItem('lifeCalendarDOB', JSON.stringify(dob));
					updateCurrentWeek();
				});
			});

			//-- mark the current week
			updateCurrentWeek();

			// TODO: Add notes to cells, show notes in modals

		});
	});
})()
