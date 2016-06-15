﻿/*
*  Power BI Visualizations
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved. 
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*   
*  The above copyright notice and this permission notice shall be included in 
*  all copies or substantial portions of the Software.
*   
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/

/// <reference path="../_references.ts"/>

module powerbitests.customVisuals {
    import GranularityType = powerbi.visuals.samples.GranularityType;
    import VisualClass = powerbi.visuals.samples.Timeline;
    import colorAssert = powerbitests.helpers.assertColorsMatch;
    import TimelineCursorOverElement = powerbi.visuals.samples.TimelineCursorOverElement;
    import TimelineData = powerbitests.customVisuals.sampleDataViews.TimelineData;

    powerbitests.mocks.setLocale();

    describe("Timeline", () => {
        let visualBuilder: TimelineBuilder;
        let defaultDataViewBuilder: TimelineData;
        let dataView: powerbi.DataView;

        beforeEach(() => {
            visualBuilder = new TimelineBuilder(1000,500);
            defaultDataViewBuilder = new TimelineData();
            dataView = defaultDataViewBuilder.getDataView();
        });

        describe('capabilities', () => {
            it("registered capabilities", () => expect(VisualClass.capabilities).toBeDefined());
        });

        describe("converter", () => {
            it("prepareValues", () => {
                let prepareValuesResults: Date[],
                    values: any;

                values = [
                    new Date("2001-01-01"),
                    null,
                    undefined,
                    NaN
                ];

                prepareValuesResults = visualBuilder.visualObject.prepareValues(values);

                expect(prepareValuesResults).toBeDefined();
                expect(prepareValuesResults.length).toEqual(1);
                expect(prepareValuesResults[0].getTime()).toEqual(new Date("2001-01-01").getTime());
            });

            it("identity column name is not changed for non-hierarchical source", () => {
                visualBuilder.update(dataView);

                let column = <powerbi.data.SQColumnRefExpr>dataView.categorical.categories[0].identityFields[0];
                expect(column.ref).toEqual(sampleDataViews.TimelineData.ColumnCategory);
            });
        });

        describe("DOM tests", () => {
            it("svg element created", () => expect(visualBuilder.mainElement[0]).toBeInDOM());

            it("basic update", (done) => {
                visualBuilder.update(dataView);
                visualBuilder.currentPeriod = GranularityType.day;

                helpers.renderTimeout(() => {
                    let countOfDays = visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").length;
					let countOfTextItems = visualBuilder.mainElement.children("g.mainArea").children("g").eq(4).children(".label").children().length;

                    expect(countOfDays).toBe(dataView.categorical.categories[0].values.length);
                    expect(countOfTextItems).toBe(dataView.categorical.categories[0].values.length);
					let cellRects = visualBuilder.mainElement.find(".cellRect");
					cellRects.last().d3Click(0, 0);
					let fill = window.getComputedStyle(cellRects[0]).fill;
					let hexFill = fill;
					if (_.startsWith(fill, '#')) {
						var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fill);
						hexFill = "rgb(" + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ")";
					}
					expect(hexFill).toBe("rgb(255, 255, 255)");
					let cellHeight = parseInt(cellRects[0].attributes.getNamedItem("height").value.replace("px", ""), 10);
					expect(cellHeight).toBeLessThan(60.1);
					expect(cellHeight).toBeGreaterThan(29.9);
                    done();
                });
            });

            it("apply blank row data", (done) => {
                visualBuilder.update(dataView);
                visualBuilder.currentPeriod = GranularityType.day;

                helpers.renderTimeout(() => {
                    dataView.categorical.categories[0].values.push(null);
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        let countOfDays = visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").length;
                        expect(countOfDays).toBe(dataView.categorical.categories[0].values.length-1);
                        done();
                    });
                });
            });

            it("basic update", (done) => {
                visualBuilder.update(dataView);
                visualBuilder.currentPeriod = GranularityType.year;
                setTimeout(() => {
                    let textLabels: JQuery = $(".selectionRangeContainer");
                     //TimeRangeText check visibility when visual is small
                    let textRangeText = powerbitests.helpers.findElementText(textLabels);
                    expect(textRangeText).toContain('2016');
                    done();
                }, DefaultWaitForRender);
            });

            it("change color for header", (done) => {
                visualBuilder.update(dataView);
                visualBuilder.currentPeriod = GranularityType.day;

               helpers.renderTimeout(() => {
                    colorAssert(visualBuilder.mainElement.children('g.rangeTextArea').children('text').css('fill'), '#777777');

                    dataView.metadata.objects = {
                        rangeHeader: {
                            fontColor: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        colorAssert(visualBuilder.mainElement.children('g.rangeTextArea').children('text').css('fill'), '#00B8AA');
                        done();
                    });
                });
            });

            it("change color for selected cell color", (done) => {
                dataView.metadata.objects = {};
                visualBuilder.update(dataView);
                visualBuilder.currentPeriod = GranularityType.day;

                helpers.renderTimeout(() => {
                    colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#ADD8E6');

                    dataView.metadata.objects = {
                        cells: {
                            fillSelected: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#00B8AA');
                        done();
                    });
                });
            });

            it("change color for notselected cell color", (done) => {
                dataView.metadata.objects = {};
                visualBuilder.update(dataView);
                visualBuilder.currentPeriod = GranularityType.day;

                helpers.renderTimeout(() => {
                    colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#ADD8E6');

                    dataView.categorical.categories[0].values = [new Date(2016,0,2)];
                    dataView.metadata.objects = {
                        cells: {
                            fillUnselected: {
                                solid: {
                                    color: "#00B8AA"
                                }
                            }
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        colorAssert(visualBuilder.mainElement.children("g.mainArea").children(".cellsArea").children(".cellRect").css('fill'), '#00B8AA');
                        done();
                    });
                });
            });

            describe("clearCatcher", () => {
                let clearCatcherElement: JQuery;

                beforeEach((done) => {
                    visualBuilder.update(dataView);
                    visualBuilder.currentPeriod = GranularityType.day;

                    spyOn(visualBuilder.visualObject, "clear");

                    helpers.renderTimeout(() => {
                        clearCatcherElement = visualBuilder.element.find(".clearCatcher");
                        done();
                    });
                });

                it("click - event", () => {
                    clearCatcherElement.d3Click(0, 0);

                    expectToCallMethodClear();
                });

                it("touchstart - event", () => {
                    clearCatcherElement.d3TouchStart();

                    expectToCallMethodClear();
                });

                function expectToCallMethodClear(): void {
                    expect(visualBuilder.visualObject["clear"]).toHaveBeenCalled();
                }
            });

            describe("granularity", () => {
                let periodSlicerSelectionRectElements: JQuery;

                beforeEach((done) => {
                    visualBuilder.update(dataView);
                    visualBuilder.currentPeriod = GranularityType.month;

                    spyOn(visualBuilder.visualObject, "redrawPeriod");

                    helpers.renderTimeout(() => {
                        periodSlicerSelectionRectElements = visualBuilder.element.find(".periodSlicerSelectionRect");
                        done();
                    });
                });

                it("mousedown - event", () => {
                    $(periodSlicerSelectionRectElements[0]).d3MouseDown(0, 0);

                    expectToCallRedrawPeriod(GranularityType.year);
                });

                it("touchstart - event", () => {
                    $(periodSlicerSelectionRectElements[4]).d3TouchStart();

                    expectToCallRedrawPeriod(GranularityType.day);
                });

                function expectToCallRedrawPeriod(granularity: GranularityType): void {
                    expect(visualBuilder.visualObject.redrawPeriod).toHaveBeenCalledWith(granularity);
                }
            });
        });

        describe("methods", () => {
            beforeEach((done) => {
                visualBuilder.update(dataView);
                visualBuilder.currentPeriod = GranularityType.day;
                helpers.renderTimeout(done);
            });

            describe("findCursorOverElement", () => {
                it("-9999", () => {
                    expectToCallFindCursorOverElement(-9999, 0);
                });

                it("9999", () => {
                    expectToCallFindCursorOverElement(9999, 8);
                });

                it("120", () => {
                    expectToCallFindCursorOverElement(120, 1);
                });

                it("220", () => {
                    expectToCallFindCursorOverElement(220, 2);
                });

                function expectToCallFindCursorOverElement(x: number, expectedIndex: number): void {
                    let cursorOverElement: TimelineCursorOverElement = visualBuilder.visualObject.findCursorOverElement(x);

                    expect(cursorOverElement).not.toBeNull();
                    expect(cursorOverElement.index).toEqual(expectedIndex);
                    expect(cursorOverElement.datapoint).not.toBeNull();
                    expect(cursorOverElement.datapoint).not.toBeUndefined();
                }
            });
        });
    });

    class TimelineBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number, isMinervaVisualPlugin: boolean = false) {
            super(width, height, isMinervaVisualPlugin);
        }

        protected build() {
            return new VisualClass();
        }

        public get visualObject(): VisualClass {
            return this.visual;
        }

        public get mainElement() {
            return this.element
                .children("div")
                .children("svg.Timeline");
        }

        public set currentPeriod(period: number) {
            this.visual.selectPeriod(period);
        }
    }
}