const {remote} = require('electron')
const {dialog, Menu, MenuItem} = remote
const fs = remote.require('fs')
const path = remote.require('path')

const meanColors = {'c1': 'rgba(225, 0, 0, 1)', 'c2': 'rgba(0, 0, 225, 1)'}
const encodingColors = {'c1': 'rgba(225, 0, 0, .2)', 'c2': 'rgba(0, 0, 225, .2)'}

const red = 'rgba(255, 94, 87,1.0)'
const yellow = 'rgba(255, 221, 89,1.0)'
const green = 'rgba(11, 232, 129,1.0)'

var active = {'c1': null, 'c2': null}

var config = null
var ctx = $('#plot')[0].getContext('2d')
var chartData = {'c1': null, 'c2': null}
var chart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: []
    },
    options: {
        tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        var label = data.datasets[tooltipItem.datasetIndex].label || ''
                        if(label) {
                            label += ': '
                        }
                        label += Math.round(tooltipItem.xLabel * 100) / 100
                        label += ', '
                        label += Math.round(tooltipItem.yLabel * 100) / 100
                        return label
                    }
                }
        },
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom',
                ticks: {
                    max: 3,
                    min: -3
                }
            }],
            yAxes: [{
                ticks: {
                    max: 3,
                    min: -3
                }
            }]
        }
    }
})

$('#plot').click(function(e) {
    var activePoint = chart.getElementAtEvent(e)
    if(activePoint[0] != undefined) {
        var dataset_idx = activePoint[0]._datasetIndex
        var idx = activePoint[0]._index
        if(idx == 0) {
            console.log('mean')
        } else {
            var c = '#c' + (dataset_idx + 1)
            $.get('http://localhost:5000/point-original?label=' + $(c + '-autocomplete').val() + '&idx=' + (idx-1), function(data) {
                $(c + '-img').attr('src', 'data:image/jpg;base64,' + data)
            })
            $.get('http://localhost:5000/point-reconstruction?label=' + $(c + '-autocomplete').val() + '&idx=' + (idx-1), function(data) {
                $(c + '-reconstr').attr('src', 'data:image/jpg;base64,' + data)
            })
        }
    }
})

function classClick(label, c) {
    active[c] = label
    $('#' + c + '-autocomplete').val(label)
    $.get('http://localhost:5000/data?label=' + label, function(data) {
        var parsed = $.parseJSON(data)
        var mean_encoding = parsed.mean
        var encodings = parsed.encodings
        var chartDatasets = []
        var bgColors = []
        encodings.splice(0, 0, mean_encoding)
        bgColors.push(meanColors[c])
        $.each(encodings, function(e) { bgColors.push(encodingColors[c]); })
        chartData[c] = {label: label, data: encodings, backgroundColor: encodingColors[c], pointBackgroundColor: bgColors}
        if(chartData['c1'] != null) {
            chartDatasets.push(chartData['c1'])
        }
        if(chartData['c2'] != null) {
            chartDatasets.push(chartData['c2'])
        }
        chart.data.datasets = chartDatasets
        chart.update()
    })
}

function getClasses() {
    $.get('http://localhost:5000/classes', function(json) {
        var data = $.parseJSON(json)
        $.each(['c1', 'c2'], function(i, c) {
            $('#' + c + '-autocomplete').autoComplete({
                minChars: 1,
                source: function(term, suggest) {
                    term = term.toLowerCase()
                    var choices = data
                    var suggestions = []
                    for (i = 0; i < choices.length; i++)
                        if (~choices[i].toLowerCase().indexOf(term)) suggestions.push(choices[i])
                    suggest(suggestions)
                },
                onSelect: function(e, term, item) {
                    classClick(term, c)
                }
            })
        })
    })
}

//Check if model already loaded on server
$(document).ready(function() {
    getClasses()
    classClick('dog', 'c1')
    classClick('animal', 'c2')
})
