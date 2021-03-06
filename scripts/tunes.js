window.addEventListener('load', function() {
  Initialise(OnTuneIndexLoaded);

  $("#keyword-search").on('input',function(e) {
    OnSearchFilterChanged();
  });

  $("#fav-filter").on('change', function(e) {
    OnSearchFilterChanged();
  });

  $("#composer-select").on('change', function(e) {
    OnSearchFilterChanged();
  });

  $("#type-select").on('change', function(e) {
    OnSearchFilterChanged();
  });

  $("#bars-select").on('change', function(e) {
    OnSearchFilterChanged();
  });
});

function OnTuneIndexLoaded()
{
  $("#keyword-search").attr("placeholder", "Search " + TuneIndex.tunes.length + " tunes...");

  $("#lbl-num-in-set").html(CurSet.length);
  $("#lbl-num-in-set").show();

  var d = new Date(TuneIndex.genTime);
  $("#updateTime").html("Last updated " + dateToString(d));

  UpdateComposerList();
  UpdateTypesList();
  UpdateBarsList();

  $("#keyword-search").val(decodeURIComponent(getHTMLParam("q", "")));
  $("#composer-select").val(decodeURIComponent(getHTMLParam("c", "")));
  $("#type-select").val(decodeURIComponent(getHTMLParam("t", "")));
  $("#bars-select").val(decodeURIComponent(getHTMLParam("b", "")));

  if(getHTMLParam("fav", "0") == "1")
  {
    $("#fav-filter").prop('checked', true);
  }
  else
  {
    $("#fav-filter").prop('checked', false);
  }

  let pageParam = getHTMLParam("p", "0");
  if(!isNaN(pageParam))
  {
    pageIndex = parseInt(pageParam)-1;
    if(pageIndex < 0) pageIndex = 0;
  }

  UpdateFilteredTunes();
}

function GetFilter() { return $("#keyword-search").val().trim();}

function clearSearch(param)
{
  if(param == 0)
  {
    $("#keyword-search").val("");
  }
  else if(param == 1)
  {
    $("#fav-filter").prop('checked', false);
  }
  else if(param == 2)
  {
    $("#composer-select").val("").change();
  }
  else if(param == 3)
  {
    $("#type-select").val("").change();
  }
  else if(param == 4)
  {
    $("#bars-select").val("").change();
  }

  UpdateFilteredTunes();
}

// returns true if the tune should be shown based on the search filter
function PassesFilter(tune)
{
  var filterFav = $("#fav-filter").is(":checked");
  var composerFilter = $("#composer-select option:selected").val();
  var barFilter = $("#bars-select option:selected").val();
  var typeFilter = $("#type-select option:selected").val();

  return MatchesFilter(tune.title, GetFilter()) &&
    (!filterFav || IsFavorite(tune.filename)) &&
    (composerFilter == "" || tune.author == composerFilter) &&
    (barFilter == "" || tune.bars == barFilter) &&
    (typeFilter == "" || tune.type == typeFilter);
}

var pageIndex = 0;

function SetPageIndex(newIndex)
{
  pageIndex = newIndex;
  UpdateFilteredTunes();
}

function PrevPage()
{
  SetPageIndex(pageIndex - 1);
}

function NextPage()
{
  SetPageIndex(pageIndex + 1);
}

var filterChangedTimeout = 0;
function OnSearchFilterChanged()
{
  if(filterChangedTimeout == 0)
    $("#tune-container").html(`<p class="loading-spinner"><i class="fas fa-spinner fa-2x fa-spin"></i></p>`);

  clearTimeout(filterChangedTimeout);
  filterChangedTimeout = setTimeout(function() {
    pageIndex = 0;
    filterChangedTimeout = 0;
    UpdateFilteredTunes();
  }, 100);
}

// update which tunes are shown based on the filter
function UpdateFilteredTunes()
{
  $("#tune-container").empty();

  var tuneTemplate = function(tune, title) {
    return `<div class="tune-entry">
              <h1>${title}<i>(${tune.type})</i></h1>
              <a href="javascript:void(0);" onclick="javascript:ViewMusicClicked('${tune.filename}', $(this));">
                <button type="button" class="btn btn-outline-dark"><i class="fas fa-music"></i> View Music</button>
              </a>
              <a href="javascript:void(0);" onclick="javascript:PlayMIDIClicked('${tune.filename}', $(this))">
                <button type="button" class="btn btn-outline-dark"><i class="fas fa-headphones"></i> Play MIDI</button>
              </a>
              <a href="javascript:void(0);" onclick="javascript:ToggleFavorite('${tune.filename}');  if(IsFavorite('${tune.filename}')) { $(this).addClass('active'); } else { $(this).removeClass('active'); }" class="fav-button ${IsFavorite(tune.filename) ? "active" : ""}">
                <button type="button" class="btn btn-outline-dark btn-favorite"><i class="fas fa-heart ico-favorite"></i> Favourite</button>
              </a>
              <a href="javascript:void(0);" onclick="javascript:AddToSetClicked('${tune.filename}', $(this));" class="set-button ${IsInSet(tune.filename) ? "active" : ""}">
                <button type="button" class="btn btn-outline-dark"><i class="fas fa-plus"></i> Add to Set</button>
              </a>
              <div class="dropdown">
                <button class="btn btn-outline-dark dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-ellipsis-h"></i></button>
                <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                  <a class="dropdown-item" href="javascript:void(0);" onclick="javascript:ViewABCClicked('${tune.filename}', $(this));">
                    <i class="fas fa-download"></i> Show ABC
                  </a>
                  <a class="dropdown-item" href="javascript:void(0);" onclick="javascript:OpenPDFModal(['${tune.filename}']);">
                    <i class="fas fa-file-pdf"></i> Create Printout
                  </a>
                </div>
              </div>
              <div class="abc-container" style="display:none">Loading...</div>
              <div class="midi-container" onload="javascript:$this.hide()">
                <div class="midi-container-hidden"></div>
                <a href="javascript:void(0);" onclick="javascript:PlayMIDI($(this).parent());" class="btn-play">
                  <button type="button" class="btn btn-outline-dark btn-favorite"><i class="fas fa-play"></i> / <i class="fas fa-pause"></i></button>
                </a>
                <a href="javascript:void(0);" onclick="javascript:StopMIDI($(this).parent());">
                  <button type="button" class="btn btn-outline-dark btn-favorite"><i class="fas fa-step-backward"></i></button>
                </a>
                <div class="progress tune-playback-bar">
                  <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <a href="javascript:void(0);" onclick="javascript:SetLooping($(this));" class="btn-loop">
                  <button type="button" class="btn btn-outline-dark btn-favorite"><i class="fas fa-sync"></i></button>
                </a>
              </div>
              <div class="music-container" style="display:none">Loading...</div>
            </div>`;
  };

  var count = 0;
  var maxperpage = 15;
  var skip = pageIndex * maxperpage;

  TuneIndex.tunes.forEach(function(tune)
  {
    if(!PassesFilter(tune)) return;

    count += 1;

    if(count <= skip || count > skip + maxperpage)
    {
      return;
    }

    var title = HighlightText(tune.title, GetFilter());
    $("#tune-container").append(tuneTemplate(tune, title));
  });

  if(count == 0)
  {
    $(".no-tunes-found").show();
    $(".tune-pagination").hide();
  }
  else
  {
    $(".no-tunes-found").hide();

    $(".tune-pagination").show();
    $(".page-count").html("" + (skip + 1) + " - " + Math.min(skip+maxperpage, count) + " of " + count + " tunes");
    var pages = $(".tune-pagination .pagination");
    if(count <= maxperpage)
    {
      pages.hide();
    }
    else
    {
      pages.show();
      pages.html("");

      if(skip != 0)
      {
        pages.append(`<li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="javascript:PrevPage();"><i class="fas fa-chevron-left"></i><span class="d-none d-md-inline-block">  Previous</span></a></li>`);
      }
      else
      {
        pages.append(`<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1"><i class="fas fa-chevron-left"></i><span class="d-none d-md-inline-block">  Previous</span></a></li>`);
      }

      let totalPages = Math.ceil(count / maxperpage);
      let maxDisplayedPages = 7;
      var i = 0;
      for(; i < pageIndex; i++)
      {
        if((pageIndex-i) > maxDisplayedPages-5 && i > 1)
        {
          pages.append(`<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>`);
          i = pageIndex - 2;
          continue;
        }

        pages.append(`<li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="javascript:SetPageIndex(${i});">${i+1}</a></li>`);
      }

      pages.append(`<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">${i+1}</a></li>`);
      i++;

      for(; i < totalPages; i++)
      {
        if((totalPages-i) > maxDisplayedPages-5 && i > pageIndex + 1)
        {
          pages.append(`<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">...</a></li>`);
          i = totalPages - 3;
          continue;
        }

        pages.append(`<li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="javascript:SetPageIndex(${i});">${i+1}</a></li>`);
      }

      if(skip + maxperpage < count)
      {
        pages.append(`<li class="page-item"><a class="page-link" href="javascript:void(0);" onclick="javascript:NextPage();"><span class="d-none d-md-inline-block">Next  </span><i class="fas fa-chevron-right"></i></a></li>`);
      }
      else
      {
        pages.append(`<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1"><span class="d-none d-md-inline-block">Next  </span><i class="fas fa-chevron-right"></i></a></li>`);
      }
    }
  }

  let badgeMarkup = (text, param) => { return `<a href="javascript:void(0);" onclick="clearSearch(${param})" class="badge badge-primary" style="margin-right:3px;">${text} <i class="fas fa-times-circle"></i></a>` };
  let badgeContainer = $("#searchDesc");

  badgeContainer.html("");

  if(GetFilter() != "")
  {
    badgeContainer.append(badgeMarkup("\"" + GetFilter() + "\"", 0));
  }

  let cFilter = $("#composer-select option:selected").val();
  if(cFilter != "")
  {
    badgeContainer.append(badgeMarkup(cFilter, 2));
  }

  var filterFav = $("#fav-filter").is(":checked");
  if(filterFav != "")
  {
    badgeContainer.append(badgeMarkup("Favorited", 1));
  }

  var filterType = $("#type-select option:selected").val();
  if(filterType != "")
  {
    badgeContainer.append(badgeMarkup(filterType, 3));
  }

  var filterBar = $("#bars-select option:selected").val();
  if(filterBar != "")
  {
    badgeContainer.append(badgeMarkup(filterBar + " Bar", 4));
  }

  if(history)
  {
    history.replaceState(null, null, GenerateHotlinkURL());
  }
}

//determines the URL parameters for the current page state
function GenerateHotlinkURL()
{
  let params = new Object();

  let query = GetFilter();
  if(query.length != 0)
  {
    params["q"] = query;
  }

  var composerFilter = $("#composer-select option:selected").val().trim();
  if(composerFilter.length != 0)
  {
    params["c"] = composerFilter;
  }

  var filterFav = $("#fav-filter").is(":checked");
  if(filterFav)
  {
    params["fav"] = 1;
  }

  var filterType = $("#type-select option:selected").val();
  if(filterType != "")
  {
    params["t"] = filterType;
  }

  var filterBar = $("#bars-select option:selected").val();
  if(filterBar != "")
  {
    params["b"] = filterBar;
  }

  if(pageIndex != 0)
  {
    params["p"] = pageIndex + 1;
  }

  let url = "tunes.html";
  let i = 0;
  for(var paramName in params) {
    url = url + (i == 0 ? "?" : "&") + paramName + "=" + encodeURIComponent(params[paramName].toString());
    i++;
  }

  return url;
}

function UpdateComposerList()
{
  $("#composer-select").empty();
  $("#composer-select").append("<option value=\"\" selected>Filter by composer...</option>");

  var composerLITemplate = function(composername, count) {
    return `<option value="${composername}">${composername} (${count})</option>`;
  }

  var uniqueComposers = [];

  TuneIndex.tunes.forEach(function(tune)
  {
    let idx = uniqueComposers.findIndex(function(composer) {
      return composer[0].trim() == tune.author.trim();
    });

    if(idx != -1)
    {
      uniqueComposers[idx][1] += 1;
      return;
    }

    uniqueComposers.push([tune.author, 1]);
  });

  uniqueComposers.sort(function(a,b) {
    return a[0] > b[0] && a[0] != "Trad";
  });

  uniqueComposers.forEach(function(composer) {
    $("#composer-select").append(composerLITemplate(composer[0], composer[1]));
  });
}

function UpdateTypesList()
{
  $("#type-select").empty();
  $("#type-select").append("<option value=\"\" selected>Filter by tune type...</option>");

  var typeLITemplate = function(name, count) {
    return `<option value="${name}">${name} (${count})</option>`;
  }

  var uniqueTypes = [];

  TuneIndex.tunes.forEach(function(tune)
  {
    let idx = uniqueTypes.findIndex(function(type) {
      return type[0].trim() == tune.type.trim();
    });

    if(idx != -1)
    {
      uniqueTypes[idx][1] += 1;
      return;
    }

    uniqueTypes.push([tune.type, 1]);
  });

  uniqueTypes.sort(function(a,b) {
    return a[0] > b[0];
  });

  uniqueTypes.forEach(function(type) {
    $("#type-select").append(typeLITemplate(type[0], type[1]));
  });
}

function UpdateBarsList()
{
  $("#bars-select").empty();
  $("#bars-select").append("<option value=\"\" selected>Filter by number of bars...</option>");

  var barsLITemplate = function(name, count) {
    return `<option value="${name}">${name} bar (${count})</option>`;
  }

  var uniqueBars = [];

  TuneIndex.tunes.forEach(function(tune)
  {
    let idx = uniqueBars.findIndex(function(bar) {
      return bar[0].trim() == tune.bars.trim();
    });

    if(idx != -1)
    {
      uniqueBars[idx][1] += 1;
      return;
    }

    uniqueBars.push([tune.bars, 1]);
  });

  uniqueBars.sort(function(a,b) {
    return a[0] > b[0];
  });

  uniqueBars.forEach(function(bars) {
    $("#bars-select").append(barsLITemplate(bars[0], bars[1]));
  });
}

function ToggleAdvancedSearch()
{
  $("#advanced-search-opts").slideToggle();
}

function ViewMusicClicked(abc, button)
{
  let musicContainer = button.parent().find('.music-container');

  if(!button.hasClass('active'))
  {
    LoadAndRenderTune(abc, musicContainer);
    musicContainer.slideDown();
    button.addClass('active');
  }
  else
  {
    musicContainer.slideUp();
    button.removeClass('active');
  }
}

function PlayMIDIClicked(abc, button)
{
  if(!button.hasClass('active'))
  {
    button.addClass('active');

    var customControls = button.parent().find('.midi-container');

    LoadMidiForTune(abc, customControls.find('.midi-container-hidden'), function() {
      customControls.slideToggle();
      customControls.css('display', 'flex');

      PlayMIDI(customControls);
    });
  }
  else
  {
    button.parent().find('.midi-container').slideToggle();
    button.removeClass('active');
  }
}

function ViewABCClicked(abc, button)
{
  let abcContainer = button.parent().parent().parent().find('.music-container');

  if(!button.hasClass('active'))
  {
    button.addClass('active');
    LoadRawABC(abc, function(abctext) {
      var lines = abctext.split('\n');
      var html = "";

      lines.forEach(function(line, idx) {
        html = html + line + "<br/>";
      });

      abcContainer.html("<p>" + html + "<p>");
      abcContainer.slideDown();
    });
  }
  else
  {
    button.removeClass('active');
    abcContainer.slideUp();
  }
}

function AddToSetClicked(tune, button)
{
  if(IsInSet(tune))
  {
    RemoveTuneFromSet(tune);
    button.removeClass('active');
  }
  else
  {
    AddTuneToSet(tune);
    button.addClass('active');
  }

  $('#lbl-num-in-set').html(CurSet.length);
}

function SetLooping(button)
{
  if(!button.hasClass('active'))
  {
    button.addClass('active');
  }
  else
  {
    button.removeClass('active');
  }
}

function PlayMIDI(container)
{
  ABCJS.midi.startPlaying(container.find('.midi-container-hidden')[0].firstChild);
}

function StopMIDI(container)
{
  ABCJS.midi.stopPlaying();
  container.find('.progress-bar').css("width", "0%");
}
