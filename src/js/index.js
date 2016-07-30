// 初始化
// ===============
$(function() {
    var txt = localStorage.getItem('code-txt')
    if (txt) {
        $('#code').val(txt)
    } else {
        var txt = '1/2+1/2;\n2323*232/34234+(22+5);\n(232+7)*6;'
        $('#code').val(txt)
        localStorage.setItem('code-txt', txt)
    }
    // handleOP()
})

// Utils
// 去除字符串中的空格
String.prototype.allTrim = function() {
    return this.replace(/(\s*)/g, "");
}


// 变量定义
// ===============
var code = []
var tokens = { //token列表

    PLUS: 0,
    MINUS: 1,
    TIMES: 2,
    DIV: 3,
    LP: 4,
    RP: 5,
    NUM_OR_ID: 6,
    SEMI: 7,
    UNKNOWN_SYMBOL: 'Error',
    NONTERMINAL: 'term'
}

// + - * / ( ) i
// 用1表示大于。-1表示小于，0表示等于，-2表示没有关系  
var opTable = [
    [1, 1, -1, -1, -1, 1, -1],
    [1, 1, -1, -1, -1, 1, -1],
    [1, 1, 1, 1, -1, 1, -1],
    [1, 1, 1, 1, -1, 1, -1],
    [-1, -1, -1, -1, -1, 0, -1],
    [1, 1, 1, 1, -2, 1, -2],
    [1, 1, 1, 1, -2, 1, -2]
]


/*
 
        E->E+T|E-T|T
        T->T*F|T/F|F
        F->(E)|i

        */


/*

       -----------------------------------算符优先关系表-----------------------------------
        |        |    +    |    -    |    *    |    /    |    (    |    )    |    i    |
        --------------------------------------------------------------------------------
        |   +    |    >    |    >    |    <    |    <    |    <    |    >    |    <    |
        --------------------------------------------------------------------------------
        |   -    |    >    |    >    |    <    |    <    |    <    |    >    |    <    |
        --------------------------------------------------------------------------------
        |   *    |    >    |    >    |    >    |    >    |    <    |    >    |    <    |
        --------------------------------------------------------------------------------
        |   /    |    >    |    >    |    >    |    >    |    <    |    >    |    <    |
        --------------------------------------------------------------------------------
        |   (    |    <    |    <    |    <    |    <    |    <    |    =    |    <    |
        --------------------------------------------------------------------------------
        |   )    |    >    |    >    |    >    |    >    |         |    >    |         |
        --------------------------------------------------------------------------------
        |   i    |    >    |    >    |    >    |    >    |         |    >    |         |
        --------------------------------------------------------------------------------

        */


// 方法定义
// ===============
var showInfo = function(txt) {
    $('#info').text(txt)
}

// 获取输入代码
var getCode = function() {
    var txt = $('#code').val().trim()
    code = txt.split('\n')
}

// 绘制词法分析表
var drawLexTable = function(lexTable, originalTxt) {
    var tb = document.createElement('table')
    tb.className = 'table table-bordered lex'
    var thead = '<thead><th>Type</th><th>Token</th></thead>'
    var tbody = '<tbody>'

    for (var i = 0, len = lexTable.length; i < len; i++) {
        tbody = tbody + '<tr><td>' + lexTable[i].type + '</td><td>' + lexTable[i].ch + '</td></tr>'
    }

    tbody += '<tbody>'
    tb.innerHTML = (thead + tbody)
    return tb
}

// 绘制语法分析表
var drawopDrw = function(opDrw) {
    var tb = document.createElement('table')
    tb.className = 'table table-bordered op'
    var thead = '<thead><th>Stack S</th><th>Relation</th><th>Input String</th><th>Reduce Rules</th></thead>'
    var tbody = '<tbody>'

    for (var i = 0, len = opDrw.length; i < len; i++) {

        // console.log(opDrw[i].stackString,opDrw[i].relation,opDrw[i].inputString,opDrw[i].redueRule)
        var relation = opDrw[i].relation
        if (relation === 0) {
            relation = '='
        } else if (relation === 1) {
            relation = '>'
        } else if (relation === -1) {
            relation = '<'
        } else {
            relation = ' '
        }
        tbody = tbody + '<tr><td>' + opDrw[i].stackString + '</td><td>' + relation + '</td><td>' + opDrw[i].inputString + '</td><td>' + opDrw[i].redueRule + '</td></tr>'
            // console.log(tbody)
    }

    tbody += '<tbody>'
    tb.innerHTML = (thead + tbody)
    return tb
}


// 语法树绘制
var drawTree = function(treeData, domPosition) {
    // console.log(domPosition)
    // console.log(JSON.stringify(treeData));
    var width = 500
    var height = 500
    var tree = d3.layout.tree()
        .size([width, height - 200])
        .separation(function(a, b) {
            return (a.parent == b.parent ? 1 : 2);
        });

    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    var svg = d3.select(domPosition).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(40,0)");

    var nodes = tree.nodes(treeData);
    var links = tree.links(nodes);

    // console.log(nodes)

    var link = svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", diagonal);

    var node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        })

    node.append("circle")
        .attr("r", 4.5);

    node.append("text")
        .attr("dx", function(d) {
            return d.children ? -8 : 8;
        })
        .attr("dy", 3)
        .style("text-anchor", function(d) {
            return d.children ? "end" : "start";
        })
        .text(function(d) {
            return d.name;
        });
}


// 词法分析
var lexer = function(txt) {
    var lexTable = []
    var errorTable = []

    var getType = function(ch) {
        switch (ch) {
            case '+':
                return tokens.PLUS;
            case '-':
                return tokens.MINUS;
            case '*':
                return tokens.TIMES;
            case '/':
                return tokens.DIV;
            case '(':
                return tokens.LP;
            case ')':
                return tokens.RP;
            case ';':
                return tokens.SEMI;
            default:

                //若不是上述token，只能是其它字符了

                if (!$.isNumeric(ch)) {
                    return tokens.UNKNOWN_SYMBOL;
                }
                return tokens.NUM_OR_ID;
        }
    }

    // 遍历字符串
    var sum = -1
    for (var i = 0, len = txt.length; i < len; i++) {
        var ch = txt[i]
        var type = getType(ch)
        if (type != tokens.NUM_OR_ID) {
            if (type == tokens.UNKNOWN_SYMBOL) {
                lexTable.push({
                    type: tokens.UNKNOWN_SYMBOL,
                    ch: ch
                })
                errorTable.push({
                    type: 'Unknown Symbol',
                    ch: ch
                })
            } else {
                if (sum >= 0) {
                    lexTable.push({
                        type: tokens.NUM_OR_ID,
                        ch: sum
                    })
                    sum = -1
                }
                lexTable.push({
                    type: type,
                    ch: ch
                })
            }

        } else {
            if (sum == -1) {
                sum = parseInt(ch)
            } else {
                sum = sum * 10 + parseInt(ch)
            }
        }
    }

    if (sum >= 0) {
        lexTable.push({
            type: tokens.NUM_OR_ID,
            ch: sum
        })
    }

    return [lexTable, errorTable]
        // return lexTable
}

// 算符优先文法
var oppr = function(lexTable) {
    var stackS = [{
        type: tokens.SEMI,
        ch: ';'
    }]
    var relation = ''
    var leftMostPhrase = ''
    var topTerminal = ''
    var redueRule = ''
    var treeData = []

    // 获取分析栈顶端终结符
    var getTopTerminal = function() {
        var i = stackS.length - 1
        for (; i >= 0; i--) {

            if (stackS[i].type != tokens.NONTERMINAL) {
                // console.log('getTopTerminal', stackS[i]);
                return i
            }
        }
    }

    // 获取终结符优先顺序
    var compareTerminal = function(a, b) {

        if (a == tokens.SEMI) {
            return -1
        }

        if (b == tokens.SEMI) {
            return 1
        }

        return opTable[a][b]
    }

    // 分析栈字符串生成
    var getStackString = function() {
        var i = 0
        var len = stackS.length
        var str = ''
        for (; i < len; i++) {
            str += stackS[i].ch
        }
        return str
    }

    // 待分析字符串生成
    var getInputString = function() {
        var i = 0
        var len = lexTable.length
        var str = ''
        for (; i < len; i++) {
            str += lexTable[i].ch
        }
        return str
    }

    // 规约过程
    var reduce = function() {
        var ch1 = stackS.pop()
        var ch2 = stackS.pop()
        var popch = ''

        if (ch1.type == tokens.NUM_OR_ID) {
            if (ch2.type == tokens.SEMI || ch2.type == tokens.LP) {
                stackS.push(ch2)
                stackS.push({
                    type: tokens.NONTERMINAL,
                    ch: 'F'
                })
                redueRule = 'F -> i'
                treeData.push({
                    'name': 'F',
                    'children': [{
                        'name': ch1.ch
                    }]
                })
            } else {
                switch (ch2.ch) {
                    case '+':
                        popch = 'T'
                        redueRule = 'T -> i'
                        treeData.push({
                            'name': 'T',
                            'children': [{
                                'name': ch1.ch
                            }]
                        })
                        break
                    case '-':
                        popch = 'T'
                        redueRule = 'T -> i'
                        treeData.push({
                            'name': 'T',
                            'children': [{
                                'name': ch1.ch
                            }]
                        })
                        break
                    case '*':
                        popch = 'F'
                        redueRule = 'F -> i'
                        treeData.push({
                            'name': 'F',
                            'children': [{
                                'name': ch1.ch
                            }]
                        })
                        break
                    case '/':
                        popch = 'F'
                        redueRule = 'F -> i'
                        treeData.push({
                            'name': 'F',
                            'children': [{
                                'name': ch1.ch
                            }]
                        })
                        break
                }
                stackS.push(ch2)
                stackS.push({
                    type: tokens.NONTERMINAL,
                    ch: popch
                })
            }


        } else {
            if (ch1.ch == 'F') {
                ch3 = stackS.pop();
                if (ch2.ch == '*' && 'TF'.includes(ch3.ch)) {
                    stackS.push({
                        type: tokens.NONTERMINAL,
                        ch: 'T'
                    })
                    var tree1 = treeData.pop()
                    var tree2 = treeData.pop()
                    treeData.push({
                        'name': 'T',
                        'children': [tree2, {
                            'name': '*'
                        }, tree1]
                    })
                    redueRule = 'T -> ' + ch3.ch + ' * ' + ch1.ch
                } else if (ch2.ch == '/' && 'TF'.indexOf(ch3.ch) > -1) {
                    stackS.push({
                        type: tokens.NONTERMINAL,
                        ch: 'T'
                    })
                    redueRule = 'T -> ' + ch3.ch + ' / ' + ch1.ch
                    var tree1 = treeData.pop()
                    var tree2 = treeData.pop()
                    treeData.push({
                        'name': 'T',
                        'children': [tree2, {
                            'name': '/'
                        }, tree1]
                    })
                } else {
                    stackS.push(ch3)
                    stackS.push(ch2)
                    stackS.push({
                        type: tokens.NONTERMINAL,
                        ch: 'T'
                    })
                    redueRule = 'T -> F'
                    var tree1 = treeData.pop()
                    treeData.push({
                        'name': 'T',
                        'children': tree1
                    })
                }
            } else if (ch1.ch == 'T') {
                ch3 = stackS.pop()

                if (ch2.ch == '+' && 'ETF'.includes(ch3.ch)) {
                    stackS.push({
                        type: tokens.NONTERMINAL,
                        ch: 'E'
                    })
                    redueRule = 'E -> ' + ch3.ch + ' + ' + ch1.ch
                    var tree1 = treeData.pop()
                    var tree2 = treeData.pop()
                    treeData.push({
                        'name': 'E',
                        'children': [tree2, {
                            'name': '+'
                        }, tree1]
                    })
                } else if (ch2.ch == '-' && 'EFT'.includes(ch3.ch)) {
                    stackS.push({
                        type: tokens.NONTERMINAL,
                        ch: 'E'
                    })
                    redueRule = 'E -> ' + ch3.ch + ' - ' + ch1.ch
                    var tree1 = treeData.pop()
                    var tree2 = treeData.pop()
                    treeData.push({
                        'name': 'E',
                        'children': [tree2, {
                            'name': '-'
                        }, tree1]
                    })
                } else {
                    console.log('555');
                }

            } else if (ch1.ch == ')') {
                if (ch2.ch == 'E') {
                    ch3 = stackS.pop()
                    if (ch3.ch == '(') {
                        stackS.push({
                            type: tokens.NONTERMINAL,
                            ch: 'F'
                        })
                        redueRule = 'F -> (E)'
                        var tree1 = treeData.pop()
                        treeData.push({
                            'name': 'F',
                            'children': [{
                                'name': '('
                            }, tree1, {
                                'name': ')'
                            }]
                        })
                    }
                }
            } else {
                console.log('语法错误')
            }
        }
    }

    var opDrw = []
    while (true) {
        var inputString = getInputString()
        var stackString = getStackString()

        topTerminal = stackS[getTopTerminal()]

        var nextTerminal = lexTable.shift()

        if (topTerminal.type == tokens.SEMI && nextTerminal.type == tokens.SEMI && stackS[stackS.length - 1].type == tokens.NONTERMINAL) {
            var stackString = getStackString()
            opDrw.push({
                stackString: stackString,
                relation: ' ',
                inputString: inputString,
                redueRule: ' '
            })
            break
        }

        var relation = compareTerminal(topTerminal.type, nextTerminal.type)

        if (relation <= 0) {

            stackS.push(nextTerminal)
            opDrw.push({
                stackString: stackString,
                relation: relation,
                inputString: inputString,
                redueRule: ' '
            })

        } else {

            lexTable.unshift(nextTerminal)

            reduce()

            opDrw.push({
                stackString: stackString,
                relation: relation,
                inputString: inputString,
                redueRule: redueRule
            })
        }
    }



    return [opDrw, treeData]
}

// 错误表绘制
var drawErrorBox = function(errorTable) {
    var i = 0
    var len = errorTable.length
    var div = document.createElement('div')
    div.className = "alert alert-danger fade in"
    var txt = ''
    for (; i < len; i++) {

        txt += '<h4><strong>Error: </strong>' + errorTable[i].type + ': "' + errorTable[i].ch + '"</h4>'

    }
    div.innerHTML = txt
    return div
}

// 处理词法分析按钮点击事件
var handleLexer = function() {
    $('#opTb').hide()
    var txt = $('#code').val()
    getCode()
    $('#info').html('')
    for (var i = 0, len = code.length; i < len; i++) {
        var lexTemp = lexer(code[i].allTrim())
        var lexTable = lexTemp[0]
        var errorTable = lexTemp[1]
        var tb = drawLexTable(lexTable)
        $('#info').append('<h2 class="text-center">' + code[i] + '</h2>')
        $('#info').append(tb)
        if (errorTable.length > 0) {
            var ertb = drawErrorBox(errorTable)
            $('#info').append(ertb)
        }

    }
}

// 处理语法分析按钮点击事件
var handleOP = function() {
    $('#opTb').hide()
    var txt = $('#code').val()
    getCode()
    $('#info').html('')

    for (var i = 0, len = code.length; i < len; i++) {
        // console.log('excuting===============', code[i])
        $('#info').append('<h2 class="text-center">' + code[i] + '</h2>')

        // 词法分析
        var lexTemp = lexer(code[i].allTrim())
        var lexTable = lexTemp[0]
        var errorTable = lexTemp[1]

        // 错误表生成
        if (errorTable.length > 0) {
            var ertb = drawErrorBox(errorTable)
            $('#info').append(ertb)
        } else {
            // 生成语法分析表
            var temp = oppr(lexTable)
            var opDrw = temp[0]
            var tb = drawopDrw(opDrw)
            $('#info').append(tb)

            // 生成树图画布                                
            var div = document.createElement('div')
            div.id = "tree" + i
            div.className = "tree"
            $('#info').append(div)

            // 绘制树图
            var treeData = temp[1]
            var treeDrawData = {
                'name': treeData[0]['name'],
                'children': treeData[0]['children']
            }
            drawTree(treeDrawData, '#' + div.id)
        }

    }


    // 分析表美化
    $('.op').find('td').each(function(i) { //搜寻表格里的每一个区间
        if (i % 4 == 2) { //‘4’代表表格总共有4列，如果区间编号被4整除，那么它就属于第一列
            $(this).addClass('col_2');
        } //给区间加上特定样式
        if (i % 4 == 0) {
            $(this).addClass('col_0');
        }
    });
    $('.op').find('th').each(function(i) { //搜寻表格里的每一个区间
        if (i % 4 == 2) { //‘4’代表表格总共有4列，如果区间编号被4整除，那么它就属于第一列
            // $(this).addClass('col_2');
        } //给区间加上特定样式
    });


}


var handleDes = function() {
    $('#info').html('')
    var div = document.createElement('div')
    div.className = "lexDes alert alert-info"
    var txt = "<h2>语法定义</h2>"

    txt += '<h4>E->E+T|E-T|T</h4>'
    txt += '<h4>T->T*F|T/F|F</h4>'
    txt += '<h4>F->(E)|i</h4>'
    div.innerHTML = txt
    $('#info').append(div)
    $('#opTb').show()
}

// 事件绑定
// ===============

// 词法分析按钮
$('#lexBtn').on('click', handleLexer)
$('#opBtn').on('click', handleOP)
$('#desBtn').on('click', handleDes)

// 本地化储存输入值
$('#code').on('keyup', function() {
    var txt = $('#code').val()
    localStorage.setItem('code-txt', txt)
})