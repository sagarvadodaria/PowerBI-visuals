
module powerbi.visuals {
    export interface DropdownSlicerBehaviorOptions {
        slicerContainer: D3.Selection;
        slicerA: D3.Selection;
        slicerDD: D3.Selection;
        itemLabels: D3.Selection;
        clear: D3.Selection;
        dataPoints: DropdownSlicerDataPoint[];
        interactivityService: IInteractivityService;
        settings: DropdownSlicerSettings;
        itemContainers: D3.Selection;
        itemInputs: D3.Selection;
        searchInput: D3.Selection;
        hasSelection: boolean;
      
    }

    export class DropdownSlicerWebBehavior implements IInteractiveBehavior {
        private itemLabels: D3.Selection;
        private itemInputs: D3.Selection;
        private dataPoints: DropdownSlicerDataPoint[];
        private interactivityService: IInteractivityService;
        private settings: DropdownSlicerSettings;
        public slicerA: D3.Selection;
        private slicerDD: D3.Selection;
        public selectedValues: string[] = [];

        public renderSelection(hasSelection: boolean): void {
            this.setSelectionOnSlicerItems(this.itemInputs, this.itemLabels, hasSelection, this.interactivityService, this.settings);
        }

        public bindEvents(options: DropdownSlicerBehaviorOptions, selectionHandler: ISelectionHandler): void {
            var slicers = options.itemContainers;
            this.itemLabels = options.itemLabels;
            this.itemInputs = options.itemInputs;
            this.dataPoints = options.dataPoints;
            this.interactivityService = options.interactivityService;
            this.settings = options.settings;
            this.slicerA = options.slicerA;
            this.slicerDD = options.slicerDD;
           
            this.bindSlicerEvents(options.slicerContainer, slicers, options.clear, selectionHandler, this.settings, this.interactivityService, options.slicerA, options.slicerDD, options.searchInput);
            if (!options.hasSelection) {
                var dropdownText = "None selected";
                this.selectedValues.length = 0;
                this.slicerA.select(".dropdownText").text(dropdownText);
                this.slicerA.attr("title", dropdownText);
            }
        }

        private bindSlicerEvents(
            slicerContainer: D3.Selection,
            slicers: D3.Selection,
            slicerClear: D3.Selection,
            selectionHandler: ISelectionHandler,
            slicerSettings: DropdownSlicerSettings,
            interactivityService: IInteractivityService,
            slicerA: D3.Selection,
            slicerDD: D3.Selection,
            slicerSearch?: D3.Selection): void {

            this.bindSlicerItemSelectionEvent(slicers, selectionHandler, slicerSettings, interactivityService);
            this.bindSlicerClearEvent(slicerClear, selectionHandler);
           
            this.styleSlicerContainer(slicerContainer, interactivityService);
            var ddNode = $(slicerDD.node());

            slicerA.on("click", function () {
                var containerNode = $(slicerContainer.node());
                containerNode.parents(".vcBody").css("overflow", "visible");
                containerNode.parents(".visualContainer").css("z-index", 999);

                if (ddNode.css('visibility') == 'hidden') {
                    ddNode.css('visibility', 'visible');
                }
                else {
                    ddNode.css('visibility', 'hidden');
                }

                d3.event.preventDefault();
            });
            
            slicerContainer.on("click", function () {
                if (d3.event.defaultPrevented)
                {
                    return;
                }
                if (ddNode.css('visibility').toLowerCase() != "hidden") {
                    ddNode.css('visibility', 'hidden');
                }
            });
        }

        private bindSlicerItemSelectionEvent(slicers: D3.Selection, selectionHandler: ISelectionHandler, slicerSettings: DropdownSlicerSettings, interactivityService: IInteractivityService): void {
            
            slicers.on("click", (d: DropdownSlicerDataPoint) => {
                d3.event.preventDefault();
                if (d.isSelectAllDataPoint) {
                    selectionHandler.toggleSelectionModeInversion();
                }
                else {
                    selectionHandler.handleSelection(d, this.isMultiSelect(d3.event, slicerSettings, interactivityService));
                }

                selectionHandler.persistSelectionFilter(slicerProps.filterPropertyIdentifier);
              
                var dropdownText = "";

                if (d.isSelectAllDataPoint) {
                    if (interactivityService.isSelectionModeInverted()) {
                        dropdownText = "All selected";
                    }
                    else {
                        dropdownText = "None selected";
                        this.selectedValues.length = 0;
                    }
                }
                else {
                    if (!slicerSettings.dropdown.singleSelect) {
                        if (interactivityService.isSelectionModeInverted()) {
                            dropdownText = "Multiple selected";
                        }
                        else {
                            if (d.selected) {
                                this.selectedValues.push(d.value);
                            }
                            else {
                                this.selectedValues.splice(this.selectedValues.indexOf(d.value), 1);
                            }
                            if (this.selectedValues.length > 3) {
                                dropdownText = this.selectedValues.length + " selected";
                            }
                            else {
                                dropdownText = this.selectedValues.join(", ");
                            }
                        }
                    }
                    else {

                        if (interactivityService.isSelectionModeInverted()) {
                            dropdownText = "Multiple selected";
                        }
                        else {
                            if (d.selected) {
                                dropdownText = d.value;
                            }
                            else {
                                dropdownText = "None selected";
                                this.selectedValues.length = 0;
                            }
                        }
                    }
                }

                this.slicerA.select(".dropdownText").text(dropdownText);
                this.slicerA.attr("title", dropdownText);
            });
        }


        private bindSlicerClearEvent(slicerClear: D3.Selection, selectionHandler: ISelectionHandler): void {
            if (slicerClear) {
                slicerClear.on("click", (d: SelectableDataPoint) => {
                    selectionHandler.handleClearSelection();
                    selectionHandler.persistSelectionFilter(slicerProps.filterPropertyIdentifier);

                    this.slicerA.select(".dropdownText").text("None selected");
                    this.selectedValues.length = 0;
                });
            }
        }

        private isMultiSelect(event: D3.D3Event, settings: DropdownSlicerSettings, interactivityService: IInteractivityService): boolean {
            return interactivityService.isSelectionModeInverted()
                || !settings.dropdown.singleSelect
                || event.ctrlKey;
        }
        
        private styleSlicerContainer(slicerContainer: D3.Selection, interactivityService: IInteractivityService) {
            var hasSelection = (interactivityService.hasSelection() && interactivityService.isDefaultValueEnabled() === undefined)
                || interactivityService.isDefaultValueEnabled() === false;
            slicerContainer.classed('hasSelection', hasSelection);
        }

        private setSelectionOnSlicerItems(selectableItems: D3.Selection, itemLabel: D3.Selection, hasSelection: boolean, interactivityService: IInteractivityService, slicerSettings: DropdownSlicerSettings): void {
           
            if (!hasSelection && !interactivityService.isSelectionModeInverted()) {

                selectableItems.filter('.selected').classed('selected', false);
                selectableItems.filter('.partiallySelected').classed('partiallySelected', false);
                var input = selectableItems.selectAll('input');
                if (input) {
                    input.property('checked', false);
                }
                itemLabel.style('color', slicerSettings.dropdown.color);
             
            }
            else {

                DropdownSlicerWebBehavior.styleSlicerItems(selectableItems, hasSelection, interactivityService.isSelectionModeInverted());
            }
        }
            
        public static styleSlicerItems(slicerItems: D3.Selection, hasSelection: boolean, isSelectionInverted: boolean): void {
           
            slicerItems.each(function (d: DropdownSlicerDataPoint) {
                var slicerItem: HTMLElement = this;
                var shouldCheck: boolean = false;
                if (d.isSelectAllDataPoint) {

                    if (hasSelection) {

                        slicerItem.classList.add('partiallySelected');
                        shouldCheck = false;
                    }
                    else {

                        slicerItem.classList.remove('partiallySelected');
                        shouldCheck = isSelectionInverted;
                    }
                }
                else {

                    shouldCheck = jsCommon.LogicExtensions.XOR(d.selected, isSelectionInverted);
                }

                if (shouldCheck) {
                   
                    slicerItem.classList.add('selected');
                    
                }
                else {
                   

                    slicerItem.classList.remove('selected');
                }

                // Set input selected state to match selection
                var input = slicerItem.getElementsByTagName('input')[0];
                if (input) {
                    input.checked = shouldCheck;
                    
                }
            });
           
           
        }
                
    }

    export var dropdownSlicerProps = {
        general: {
            outlineColor: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'outlineColor' },
            outlineWeight: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'outlineWeight' },
            orientation: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'orientation' },
            count: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'count' },
            selfFilterEnabled: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'selfFilterEnabled' },
        },
        dropdown: {
            selectAllCheckboxEnabled: <DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'selectAllCheckboxEnabled' },
            singleSelect: <DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'singleSelect' },
            fontColor: <DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'fontColor' },
            background: <DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'background' },
            textSize: <DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'textSize' },
        },
        header: {
            show: <DataViewObjectPropertyIdentifier>{ objectName: 'header', propertyName: 'show' },
            fontColor: <DataViewObjectPropertyIdentifier>{ objectName: 'header', propertyName: 'fontColor' },
            background: <DataViewObjectPropertyIdentifier>{ objectName: 'header', propertyName: 'background' },
            outline: <DataViewObjectPropertyIdentifier>{ objectName: 'header', propertyName: 'outline' },
            textSize: <DataViewObjectPropertyIdentifier>{ objectName: 'header', propertyName: 'textSize' },
        },
        selectedPropertyIdentifier: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'selected' },
        filterPropertyIdentifier: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'filter' },
        selfFilterPropertyIdentifier: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'selfFilter' },
        formatString: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' },
        defaultValue: <DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'defaultValue' },
    };

    import PixelConverter = jsCommon.PixelConverter;

    /** Utility class for slicer*/
    export module DropdownSlicerUtil {
        /** CSS selectors for slicer elements. */
        export module DropdownSelectors {
            import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

            export var HeaderContainer = createClassAndSelector('headerContainer');
            export var Header = createClassAndSelector('slicerHeader');
            export var TitleHeader = createClassAndSelector('titleHeader');
            export var HeaderText = createClassAndSelector('headerText');
            export var Body = createClassAndSelector('slicerBody');
            export var Label = createClassAndSelector('slicerLabel');
            export var LabelText = createClassAndSelector('slicerText');
            export var LabelImage = createClassAndSelector('slicerImage');
            export var CountText = createClassAndSelector('slicerCountText');
            export var Clear = createClassAndSelector('clear');
            export var SearchHeader = createClassAndSelector('searchHeader');
            export var SearchHeaderCollapsed = createClassAndSelector('collapsed');
            export var SearchHeaderShow = createClassAndSelector('show');
            export var MultiSelectEnabled = createClassAndSelector('isMultiSelectEnabled');
        }

        /** var declarations*/
        export module DropdownDisplayNameKeys {
            export var Clear = 'Slicer_Clear';
            export var SelectAll = 'Slicer_SelectAll';
            export var Search = 'SearchBox_Text';
        }

        /** Helper class for slicer settings  */
        export module DropdownSettingsHelper {
            export function areSettingsDefined(data: DropdownSlicerData): boolean {
                return data != null && data.slicerSettings != null;
            }
        }

        /** Helper class for handling slicer default value  */
        export module DropdownDefaultValueHandler {
            export function getIdentityFields(dataView: DataView): data.SQExpr[] {
                if (!dataView)
                    return;

                var dataViewCategorical = dataView.categorical;
                if (!dataViewCategorical || _.isEmpty(dataViewCategorical.categories))
                    return;

                return <data.SQExpr[]>dataViewCategorical.categories[0].identityFields;
            }
        }

        export function Dropdown_tryRemoveValueFromRetainedList(value: DataViewScopeIdentity, selectedScopeIds: DataViewScopeIdentity[], caseInsensitive?: boolean): boolean {
            if (!value || _.isEmpty(selectedScopeIds))
                return false;

            for (var i = 0, len = selectedScopeIds.length; i < len; i++) {
                var retainedValueScopeId = selectedScopeIds[i];
                if (DataViewScopeIdentity.equals(value, retainedValueScopeId, caseInsensitive)) {
                    selectedScopeIds.splice(i, 1);
                    return true;
                }
            }

            return false;
        }

        /** Helper class for creating and measuring slicer DOM elements  */
        export class DropdownDOMHelper {
            public createSlicerHeader(hostServices: IVisualHostServices): HTMLElement {
                var slicerHeaderDiv = document.createElement('div');
                slicerHeaderDiv.className = DropdownSelectors.Header.class;

                var slicerHeader: D3.Selection = d3.select(slicerHeaderDiv);
                var slicerTitle = slicerHeader.append('h2')
                    .classed(DropdownSelectors.TitleHeader.class, true);
                slicerTitle.append('span')
                    .classed(DropdownSelectors.Clear.class, true)
                    .attr('title', hostServices.getLocalizedString(DropdownDisplayNameKeys.Clear));
                slicerTitle.append('div').classed(DropdownSelectors.HeaderText.class, true);
                var slicerSearch = slicerHeader.append('div')
                    .classed(DropdownSelectors.SearchHeader.class, true)
                    .classed(DropdownSelectors.SearchHeaderCollapsed.class, true);
                slicerSearch.append('span')
                    .classed('powervisuals-glyph search', true)
                    .attr('title', hostServices.getLocalizedString(DropdownDisplayNameKeys.Search));

                slicerSearch.append('input')
                    .attr('type', 'text');

                return slicerHeaderDiv;
            }

            public getHeaderTextProperties(settings: DropdownSlicerSettings): TextProperties {
                var headerTextProperties: TextProperties = {
                    fontFamily: 'wf_segoe-ui_normal',
                    fontSize: '10px'
                };
                if (settings.header.show) {
                    headerTextProperties.fontSize = PixelConverter.fromPoint(settings.header.textSize);
                }
                return headerTextProperties;
            }

            public getSlicerBodyViewport(currentViewport: IViewport, settings: DropdownSlicerSettings, headerTextProperties: TextProperties): IViewport {
                var headerHeight = (settings.header.show) ? this.getHeaderHeight(settings, headerTextProperties) : 0;
                var slicerBodyHeight = currentViewport.height - (headerHeight + settings.header.borderBottomWidth);
                return {
                    height: slicerBodyHeight,
                    width: currentViewport.width
                };
            }

            public updateSlicerBodyDimensions(currentViewport: IViewport, slicerBody: D3.Selection, settings: DropdownSlicerSettings): void {
                var slicerViewport = this.getSlicerBodyViewport(currentViewport, settings, this.getHeaderTextProperties(settings));
                slicerBody.style({
                    'height': PixelConverter.toString(slicerViewport.height),
                    'width': PixelConverter.toString(slicerViewport.width),
                });
            }

            public getHeaderHeight(settings: DropdownSlicerSettings, textProperties: TextProperties): number {
                return TextMeasurementService.estimateSvgTextHeight(this.getTextProperties(settings.header.textSize, textProperties)) + settings.general.outlineWeight;
            }

            public getRowHeight(settings: DropdownSlicerSettings, textProperties: TextProperties): number {
                return TextMeasurementService.estimateSvgTextHeight(this.getTextProperties(settings.dropdown.textSize, textProperties));
            }

            public styleSlicerHeader(slicerHeader: D3.Selection, settings: DropdownSlicerSettings, headerText: string): void {
                var titleHeader = slicerHeader.select(DropdownSlicerUtil.DropdownSelectors.TitleHeader.selector);
                var searchHeader = slicerHeader.select(DropdownSlicerUtil.DropdownSelectors.SearchHeader.selector);
                if (settings.header.show) {
                    titleHeader.style('display', 'block');
                    var headerTextElement = slicerHeader.select(DropdownSelectors.HeaderText.selector)
                        .text(headerText);
                    this.setSlicerHeaderTextStyle(titleHeader, headerTextElement, settings, settings.search.enabled);
                } else {
                    titleHeader.style('display', 'none');
                }

                if (settings.search.enabled) {
                    searchHeader.classed(DropdownSelectors.SearchHeaderShow.class, true);
                    searchHeader.classed(DropdownSelectors.SearchHeaderCollapsed.class, false);
                } else {
                    searchHeader.classed(DropdownSelectors.SearchHeaderShow.class, false);
                    searchHeader.classed(DropdownSelectors.SearchHeaderCollapsed.class, true);
                }
            }

            public setSlicerTextStyle(slicerText: D3.Selection, settings: DropdownSlicerSettings): void {
                slicerText
                    .style({
                        'color': settings.dropdown.color,
                        'border-color': settings.general.outlineColor,
                        'font-size': PixelConverter.fromPoint(settings.dropdown.textSize),
                    });
            }

            public getRowsOutlineWidth(outlineElement: string, outlineWeight: number): number {
                switch (outlineElement) {
                    case outline.none:
                    case outline.leftRight:
                        return 0;
                    case outline.bottomOnly:
                    case outline.topOnly:
                        return outlineWeight;
                    case outline.topBottom:
                    case outline.frame:
                        return outlineWeight * 2;
                    default:
                        return 0;
                }
            }

            private setSlicerHeaderTextStyle(slicerHeader: D3.Selection, headerTextElement: D3.Selection, settings: DropdownSlicerSettings, searchEnabled: boolean): void {
                var hideOutline = false;

                if (searchEnabled) {
                    var defaultSetting = DropdownSlicer.DefaultStyleProperties();
                    hideOutline = (settings.header.outline === defaultSetting.header.outline
                        && settings.general.outlineWeight === defaultSetting.general.outlineWeight
                        && settings.general.outlineColor === defaultSetting.general.outlineColor);
                }

                slicerHeader
                    .style({
                        'border-style': hideOutline ? 'none' : 'solid',
                        'border-color': settings.general.outlineColor,
                        'border-width': VisualBorderUtil.getBorderWidth(settings.header.outline, settings.general.outlineWeight),
                    });

                headerTextElement
                    .style({
                        'color': settings.header.fontColor,
                        'background-color': settings.header.background,
                        'font-size': PixelConverter.fromPoint(settings.header.textSize),
                    });
            }

            private getTextProperties(textSize: number, textProperties: TextProperties): TextProperties {
                textProperties.fontSize = PixelConverter.fromPoint(textSize);
                return textProperties;
            }
        }
    }

    export interface IDropdownView {
        data(data: any[], dataIdFunction: (d) => {}, dataAppended: boolean): IDropdownView;
        rowHeight(rowHeight: number): IDropdownView;
        viewport(viewport: IViewport): IDropdownView;
        render(): void;
        empty(): void;
        slicerA: D3.Selection;
        slicerDD: D3.Selection;
        scrollbarInner: D3.Selection;
        ddHeight: number;
    }

    export module DropdownViewFactory {
        export function createDropdownView(options): IDropdownView {
            return new DropdownView(options);
        }
    }

    export interface DropdownViewOptions {
        enter: (selection: D3.Selection) => void;
        exit: (selection: D3.Selection) => void;
        update: (selection: D3.Selection) => void;
        loadMoreData: () => void;
        baseContainer: D3.Selection;
        rowHeight: number;
        viewport: IViewport;
        scrollEnabled: boolean;
        isReadMode: () => boolean;
    }

    class DropdownView implements IDropdownView {
        private getDatumIndex: (d: any) => {};
        private _data: any[];
        private _totalRows: number;

        private options: DropdownViewOptions;
        private visibleGroupContainer: D3.Selection;
        private scrollContainer: D3.Selection;
        public scrollbarInner: D3.Selection;
        private cancelMeasurePass: () => void;
        private renderTimeoutId: number;
        public slicerA: D3.Selection;
        public slicerDD: D3.Selection;
        public ddHeight: number;
       
        private static loadMoreDataThreshold = 0.8;
        private static defaultRowHeight = 1;

        public constructor(options: DropdownViewOptions) {
            this.options = $.extend(true, {}, options);

            var dropdown = options.baseContainer.append('dl').classed('dropdown', true);
            var term = dropdown.append('dt');

            var dtA = this.slicerA = term.append('a').attr('xlink:href', '#');
            var dtAS = dtA.append('span').classed('dropdownText', true).text("None selected");
            var caret = dtA.append('b').classed('caret', true);
            var descriptions = this.slicerDD = dropdown.append('dd');
            

            this.scrollbarInner = descriptions
                .append('div')
                .classed('scrollbar-inner', true)
                .on('scroll', () => this.renderImpl(this.options.rowHeight));

           

            this.scrollContainer = this.scrollbarInner
                .append('div')
                .classed('scrollRegion', true)
                .on('touchstart', () => this.stopTouchPropagation())
                .on('touchmove', () => this.stopTouchPropagation());
                          
            
            this.visibleGroupContainer = this.scrollContainer
                .append('div')
                .classed('visibleGroup', true);
            
           
            DropdownView.SetDefaultOptions(options);
            
        }

        private static SetDefaultOptions(options: DropdownViewOptions) {
            options.rowHeight = options.rowHeight || DropdownView.defaultRowHeight;
        }

        public rowHeight(rowHeight: number): DropdownView {
            this.options.rowHeight = Math.ceil(rowHeight);
            return this;
        }

        public data(data: any[], getDatumIndex: (d) => {}, dataReset: boolean = false): IDropdownView {
            this._data = data;
            this.getDatumIndex = getDatumIndex;
            this.setTotalRows();
            if (dataReset)
                $(this.scrollbarInner.node()).scrollTop(0);

            this.render();
            return this;
        }

        public viewport(viewport: IViewport): IDropdownView {
            this.options.viewport = viewport;
            this.render();
            return this;
        }

        public empty(): void {
            this._data = [];
            this.render();
        }

        public render(): void {
            if (this.renderTimeoutId)
                window.clearTimeout(this.renderTimeoutId);

            this.renderTimeoutId = window.setTimeout(() => {
                this.getRowHeight().then((rowHeight: number) => {
                    this.renderImpl(rowHeight);
                });
                this.renderTimeoutId = undefined;
            }, 0);
        }

        private renderImpl(rowHeight: number): void {
            var totalHeight = this.options.scrollEnabled ? Math.max(0, (this._totalRows * rowHeight)) : this.options.viewport.height;
            this.scrollContainer
                .style('height', totalHeight + "px")
                .attr('height', totalHeight);
           
            this.scrollToFrame(true /*loadMoreData*/);
            this.ddHeight = (this._totalRows * this.options.rowHeight) + 20 >= 300 ? 300 : (this._totalRows * this.options.rowHeight + 20);
            $(this.slicerDD.node()).css("height", this.ddHeight + "px");
            $(this.slicerDD.node()).css("max-height", this.ddHeight + "px");
        }

        private stopTouchPropagation(): void {
            //Stop the propagation only in read mode so the drag won't be affected.
            if (this.options.isReadMode()) {
                if (d3.event.type === "touchstart") {
                    //let event: TouchEvent = <any>d3.event;
                    ////If there is another touch point outside this visual than the event should be propagated.
                    ////This way the pinch to zoom will not be affected.
                    //if (event.touches && event.touches.length === 1) {
                    //    d3.event.stopPropagation();
                    //}
                }
                if (d3.event.type === "touchmove") {
                    d3.event.stopPropagation();
                }
            }
        }

        private scrollToFrame(loadMoreData: boolean): void {
            var options = this.options;
            var visibleGroupContainer = this.visibleGroupContainer;
            var totalRows = this._totalRows;
            var rowHeight = options.rowHeight || DropdownView.defaultRowHeight;
            var visibleRows = this.getVisibleRows();
            var scrollTop: number = this.scrollbarInner.node().scrollTop;
            var scrollPosition = (scrollTop === 0) ? 0 : Math.floor(scrollTop / rowHeight);
            var transformAttr = SVGUtil.translateWithPixels(0, scrollPosition * rowHeight);

            visibleGroupContainer.style({
                'transform': d => transformAttr,
                '-webkit-transform': transformAttr
            });

            var position0 = Math.max(0, Math.min(scrollPosition, totalRows - visibleRows + 1)),
                position1 = position0 + visibleRows;

            var rowSelection = visibleGroupContainer.selectAll(".row")
                .data(this._data.slice(position0, Math.min(position1, totalRows)), this.getDatumIndex);

            rowSelection
                .enter()
                .append('div')
                .classed('row', true)
                .call(d => options.enter(d));
            rowSelection.order();

            var rowUpdateSelection = visibleGroupContainer.selectAll('.row:not(.transitioning)');

            rowUpdateSelection.call(d => options.update(d));

            rowSelection
                .exit()
                .call(d => options.exit(d))
                .remove();

            if (loadMoreData && visibleRows !== totalRows && position1 >= totalRows * DropdownView.loadMoreDataThreshold)
                options.loadMoreData();
        }

        private setTotalRows(): void {
            var data = this._data;
            this._totalRows = data ? data.length : 0;
        }

        private getVisibleRows(): number {
            var minimumVisibleRows = 1;
            var options = this.options;
            var rowHeight = options.rowHeight;
            var viewportHeight = 300;

            if (!rowHeight || rowHeight < 1)
                return minimumVisibleRows;

            // How many rows of space the viewport can hold (not the number of rows it can display).
            var viewportRowCount = viewportHeight / rowHeight;

            if (this.options.scrollEnabled) {
                // Ceiling the count since we can have items be partially displayed when scrolling.
                // Add 1 to make sure we always render enough rows to cover the entire viewport (handles when rows are partially visible when scrolling).
                // Ex. If you have a viewport that can show 280 (viewport height) / 100 (row height) = 2.8 rows, you need to have up to Math.ceil(2.8) + 1 = 4 rows of data to cover the viewport.
                // If you only had Math.ceil(2.8) = 3 rows of data, and the top rows was 50% visible (scrolled up), you'd only be able to cover .5 + 1 + 1 = 2.5 rows of the viewport.
                // This makes a gap at the bottom of the listview.
                // Add an extra row of data and we can cover .5 + 1 + 1 + 1 = 3.5 rows of the viewport. 3.5 is enough to cover the entire viewport as only 2.8 is needed.
                // 1 is always added, even if not needed, to keep logic simple. Advanced logic would figure out what % of the top row is visible and use that to add 1 if needed.
                return Math.min(Math.ceil(viewportRowCount) + 1, this._totalRows) || minimumVisibleRows;
            }

            // Floor the count since that's the maximum number of entire rows we can display without scrolling.
            return Math.min(Math.floor(viewportRowCount), this._totalRows) || minimumVisibleRows;
        }

        private getRowHeight(): JQueryPromise<number> {
            var deferred = $.Deferred<number>();
            var listView = this;
            var options = listView.options;
            if (this.cancelMeasurePass)
                this.cancelMeasurePass();

            // if there is no data, resolve and return
            if (!(this._data && this._data.length && options)) {
                listView.rowHeight(DropdownView.defaultRowHeight);
                return deferred.resolve(options.rowHeight).promise();
            }

            this.scrollToFrame(false /*loadMoreData*/);
            var requestAnimationFrameId = window.requestAnimationFrame(() => {
                //measure row height
                var rows = listView.visibleGroupContainer.select(".row");
                if (!rows.empty()) {
                    var firstRow = rows.node();
                    var rowHeight: number = Math.max($(firstRow).outerHeight(true), $(firstRow).children().first().outerHeight(true));
                    listView.rowHeight(rowHeight);
                    deferred.resolve(rowHeight);
                }

                listView.cancelMeasurePass = undefined;
                window.cancelAnimationFrame(requestAnimationFrameId);
            });

            this.cancelMeasurePass = () => {
                window.cancelAnimationFrame(requestAnimationFrameId);
                deferred.reject();
            };

            return deferred.promise();
        }
    }



    import SemanticFilter = powerbi.data.SemanticFilter;
    import UrlUtils = jsCommon.UrlUtils;

    export module DropdownSlicerDataConversion {
        export function convert(dataView: DataView, localizedSelectAllText: string, interactivityService: IInteractivityService | ISelectionHandler, hostServices: IVisualHostServices): DropdownSlicerData {
            if (!dataView || !dataView.categorical || _.isEmpty(dataView.categorical.categories))
                return;

            var identityFields = dataView.categorical.categories[0].identityFields;

            if (!identityFields)
                return;

            var filter: SemanticFilter = <SemanticFilter>(
                dataView.metadata &&
                dataView.metadata.objects &&
                DataViewObjects.getValue(dataView.metadata.objects, dropdownSlicerProps.filterPropertyIdentifier));

            var analyzer = hostServices.analyzeFilter({
                dataView: dataView,
                defaultValuePropertyId: dropdownSlicerProps.defaultValue,
                filter: filter,
                fieldSQExprs: identityFields
            });
            if (!analyzer)
                return;

            var analyzedSemanticFilter = <SemanticFilter>analyzer.filter;
            if (analyzedSemanticFilter && !SemanticFilter.isSameFilter(analyzedSemanticFilter, filter)) {
                (<ISelectionHandler>interactivityService).handleClearSelection();
                var filterPropertyIdentifier = dropdownSlicerProps.filterPropertyIdentifier;
                var properties: { [propertyName: string]: DataViewPropertyValue } = {};
                properties[filterPropertyIdentifier.propertyName] = analyzer.filter;
                var instance = {
                    objectName: filterPropertyIdentifier.objectName,
                    selector: undefined,
                    properties: properties
                };

                var changes: VisualObjectInstancesToPersist = {
                    merge: [instance]
                };
                hostServices.persistProperties(changes);
            }

            var slicerData = getSlicerData(analyzer, dataView.metadata, dataView.categorical, localizedSelectAllText, <IInteractivityService>interactivityService, hostServices);
            return slicerData;
        }

        function getSlicerData(
            analyzer: AnalyzedFilter,
            dataViewMetadata: DataViewMetadata,
            categorical: DataViewCategorical,
            localizedSelectAllText: string, interactivityService: IInteractivityService, hostServices: IVisualHostServices): DropdownSlicerData {
            var isInvertedSelectionMode: boolean = interactivityService && interactivityService.isSelectionModeInverted();
            var selectedScopeIds = analyzer.selectedIdentities;

            var hasSelectionOverride = !_.isEmpty(selectedScopeIds) || isInvertedSelectionMode === true;
            if (!isInvertedSelectionMode && analyzer.filter)
                isInvertedSelectionMode = analyzer.isNotFilter;

            if (interactivityService) {
                interactivityService.setSelectionModeInverted(isInvertedSelectionMode);

                interactivityService.setDefaultValueMode(SemanticFilter.isDefaultFilter(<SemanticFilter>analyzer.filter));
            }

            var category = categorical.categories[0];
            var categoryValuesLen: number = category && category.values ? category.values.length : 0;
            var slicerDataPoints: DropdownSlicerDataPoint[] = [];
            var formatString = valueFormatter.getFormatString(category.source, dropdownSlicerProps.formatString);
            var numOfSelected: number = 0;
            var valueCounts = categorical.values && categorical.values[0] && categorical.values[0].values;
            if (valueCounts && _.isEmpty(valueCounts))
                valueCounts = undefined;

            debug.assert(!valueCounts || valueCounts.length === categoryValuesLen, "valueCounts doesn't match values");
            var isImageData = dataViewMetadata &&
                !_.isEmpty(dataViewMetadata.columns) && converterHelper.isImageUrlColumn(dataViewMetadata.columns[0]);
            var displayNameIdentityPairs: DisplayNameIdentityPair[] = [];
            for (var i = 0; i < categoryValuesLen; i++) {
                var scopeId = category.identity && category.identity[i];
                var value = category.values && category.values[i];
                var count = valueCounts && valueCounts[i];

                var isRetained = hasSelectionOverride ? DropdownSlicerUtil.Dropdown_tryRemoveValueFromRetainedList(scopeId, selectedScopeIds) : false;
                var label: string = valueFormatter.format(value, formatString);
                var isImage = isImageData === true && UrlUtils.isValidImageUrl(label);
                var slicerData: DropdownSlicerDataPoint = {
                    value: label,
                    tooltip: label,
                    identity: SelectionId.createWithId(scopeId),
                    selected: isRetained,
                    count: <number>count,
                    isImage: isImage,
                };

                if (isRetained) {
                    var displayNameIdentityPair: DisplayNameIdentityPair = {
                        displayName: label,
                        identity: scopeId
                    };
                    displayNameIdentityPairs.push(displayNameIdentityPair);
                }

                slicerDataPoints.push(slicerData);
                if (slicerData.selected)
                    numOfSelected++;
            }

            if (!_.isEmpty(displayNameIdentityPairs))
                hostServices.setIdentityDisplayNames(displayNameIdentityPairs);

            if (hasSelectionOverride && !_.isEmpty(selectedScopeIds)) {

                var displayNamesIdentityPairs = hostServices.getIdentityDisplayNames(selectedScopeIds);
                if (!_.isEmpty(displayNamesIdentityPairs)) {
                        for (var i = 0; i < displayNameIdentityPairs.length; i++) {
                            var pair = displayNamesIdentityPairs[i];
                        var slicerData: DropdownSlicerDataPoint = {
                            value: pair.displayName,
                            tooltip: pair.displayName,
                            identity: SelectionId.createWithId(pair.identity),
                            selected: true,
                            count: valueCounts != null ? 0 : undefined,
                        };

                        slicerDataPoints.push(slicerData);
                        numOfSelected++;
                    }
                }
            }

            var defaultSettings = createDefaultSettings(dataViewMetadata);
            if (defaultSettings.dropdown.selectAllCheckboxEnabled) {
                if (numOfSelected > 0 && !dataViewMetadata.segment && numOfSelected === slicerDataPoints.length) {
                    isInvertedSelectionMode = !isInvertedSelectionMode;
                    interactivityService.setSelectionModeInverted(isInvertedSelectionMode);
                    for (var x = 0; x < slicerDataPoints.length; x++) {
                        var item = slicerDataPoints[x];
                        item.selected = false;
                    }
                    hasSelectionOverride = false;
                    numOfSelected = 0;
                }

                slicerDataPoints.unshift({
                    value: localizedSelectAllText,
                    tooltip: localizedSelectAllText,
                    identity: SelectionId.createWithMeasure(localizedSelectAllText),
                    selected: !!isInvertedSelectionMode && numOfSelected === 0,
                    isSelectAllDataPoint: true,
                    count: undefined,
                });
            }

            var slicerDatax: DropdownSlicerData = {
                categorySourceName: category.source.displayName,
                slicerSettings: defaultSettings,
                slicerDataPoints: slicerDataPoints,
                hasSelectionOverride: hasSelectionOverride,
                defaultValue: analyzer.defaultValue,
            };

            return slicerDatax;
        }

        function createDefaultSettings(dataViewMetadata: DataViewMetadata): DropdownSlicerSettings {
            var defaultSettings = DropdownSlicer.DefaultStyleProperties();
            var objects = dataViewMetadata.objects;
            var forceSingleSelect = dataViewMetadata.columns && _.some(dataViewMetadata.columns, (column) => column.discourageAggregationAcrossGroups);

            if (objects) {
                defaultSettings.general.outlineColor = DataViewObjects.getFillColor(objects, dropdownSlicerProps.general.outlineColor, defaultSettings.general.outlineColor);
                defaultSettings.general.outlineWeight = DataViewObjects.getValue<number>(objects, dropdownSlicerProps.general.outlineWeight, defaultSettings.general.outlineWeight);

                defaultSettings.header.show = DataViewObjects.getValue<boolean>(objects, dropdownSlicerProps.header.show, defaultSettings.header.show);
                defaultSettings.header.fontColor = DataViewObjects.getFillColor(objects, dropdownSlicerProps.header.fontColor, defaultSettings.header.fontColor);
                var headerBackground = DataViewObjects.getFillColor(objects, dropdownSlicerProps.header.background);
                if (headerBackground)
                    defaultSettings.header.background = headerBackground;
                defaultSettings.header.outline = DataViewObjects.getValue<string>(objects, dropdownSlicerProps.header.outline, defaultSettings.header.outline);
                defaultSettings.header.textSize = DataViewObjects.getValue<number>(objects, dropdownSlicerProps.header.textSize, defaultSettings.header.textSize);

                defaultSettings.dropdown.color = DataViewObjects.getFillColor(objects, dropdownSlicerProps.dropdown.fontColor, defaultSettings.dropdown.color);
                var textBackground = DataViewObjects.getFillColor(objects, dropdownSlicerProps.dropdown.background);
                if (textBackground)
                    defaultSettings.dropdown.background = textBackground;

                defaultSettings.dropdown.textSize = DataViewObjects.getValue<number>(objects, dropdownSlicerProps.dropdown.textSize, defaultSettings.dropdown.textSize);

                defaultSettings.dropdown.selectAllCheckboxEnabled = !forceSingleSelect && DataViewObjects.getValue<boolean>(objects, dropdownSlicerProps.dropdown.selectAllCheckboxEnabled, defaultSettings.dropdown.selectAllCheckboxEnabled);
                defaultSettings.dropdown.singleSelect = forceSingleSelect || DataViewObjects.getValue<boolean>(objects, dropdownSlicerProps.dropdown.singleSelect, defaultSettings.dropdown.singleSelect);
                defaultSettings.search.enabled = DataViewObjects.getValue<boolean>(objects, dropdownSlicerProps.general.selfFilterEnabled, defaultSettings.search.enabled);
            }

            return defaultSettings;
        }
    }
   
    import DisplayNameKeys = DropdownSlicerUtil.DropdownDisplayNameKeys;
    import DOMHelper = DropdownSlicerUtil.DropdownDOMHelper;
    import SettingsHelper = DropdownSlicerUtil.DropdownSettingsHelper;

    export interface DropdownSlicerDefaultValueHandler {
        getDefaultValue(): data.SQConstantExpr;
        getIdentityFields(): data.SQExpr[];
    }

    export interface DropdownSlicerConstructorOptions {
        domHelper?: DOMHelper;
        behavior?: IInteractiveBehavior;
    }

    export interface IDropdownSlicerRenderer {
        init(options: DropdownSlicerInitOptions): IInteractivityService;
        render(options: DropdownSlicerRenderOptions): void;
    }

    export interface DropdownSlicerRenderOptions {
        dataView: DataView;
        data: DropdownSlicerData;
        viewport: IViewport;
        resetScrollbarPosition?: boolean;
    }

    export interface DropdownSlicerData {
        categorySourceName: string;
        slicerDataPoints: DropdownSlicerDataPoint[];
        slicerSettings: DropdownSlicerSettings;
        hasSelectionOverride?: boolean;
        defaultValue?: DefaultValueDefinition;
    }

    export interface DropdownSlicerDataPoint extends SelectableDataPoint {
        value: string;
        tooltip: string;
        isSelectAllDataPoint?: boolean;
        count: number;
        isImage?: boolean;
    }



    export interface DropdownCheckboxStyle {
        transform: string;
        'transform-origin': string;
        'font-size': string;
    }

    export interface DropdownSlicerSettings {
        general: {
            outlineColor: string;
            outlineWeight: number;
        };
        header: {
            borderBottomWidth: number;
            show: boolean;
            outline: string;
            fontColor: string;
            background?: string;
            textSize: number;
        };
        dropdown: {
            color: string;
            background?: string;
            textSize: number;
            selectAllCheckboxEnabled: boolean;
            singleSelect: boolean;
        };
        search: {
            enabled: boolean;
        };
    }

    export interface DropdownSlicerInitOptions {
        visualInitOptions: VisualInitOptions;
        loadMoreData: () => void;
    }

    export class DropdownSlicerRenderer implements IDropdownSlicerRenderer, DropdownSlicerDefaultValueHandler {
        private element: JQuery;
        private currentViewport: IViewport;
        private dataView: DataView;
        private header: D3.Selection;
        private body: D3.Selection;
        private container: D3.Selection;
        private slicerA: D3.Selection;
        private slicerUL: D3.Selection;
        private dropdownView: IDropdownView;
        private data: DropdownSlicerData;
        private settings: DropdownSlicerSettings;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;
        private textProperties: TextProperties = {
            'fontFamily': 'wf_segoe-ui_normal, helvetica, arial, sans-serif',
            'fontSize': '14px',
        };
        private domHelper: DropdownSlicerUtil.DropdownDOMHelper;

        constructor(options?: DropdownSlicerConstructorOptions) {
            if (options) {
                this.behavior = options.behavior;
            }
            this.domHelper = options.domHelper;
        }

        public getDefaultValue(): data.SQConstantExpr {
            if (this.data && this.data.defaultValue)
                return <data.SQConstantExpr>this.data.defaultValue.value;
        }

        public getIdentityFields(): data.SQExpr[] {
            return DropdownSlicerUtil.DropdownDefaultValueHandler.getIdentityFields(this.dataView);
        }

        public init(slicerInitOptions: DropdownSlicerInitOptions): IInteractivityService {
            this.element = slicerInitOptions.visualInitOptions.element;
            this.currentViewport = slicerInitOptions.visualInitOptions.viewport;
            var hostServices = this.hostServices = slicerInitOptions.visualInitOptions.host;

            var settings = this.settings = DropdownSlicer.DefaultStyleProperties();
            var domHelper = this.domHelper;
            var bodyViewport = domHelper.getSlicerBodyViewport(this.currentViewport, settings, this.textProperties);
            var interactivityService: IInteractivityService;

            if (this.behavior)
                interactivityService = createInteractivityService(hostServices);
            var containerDiv = document.createElement('div');
            containerDiv.className = Selectors.Container.class;
            var container = this.container = d3.select(containerDiv);

            var header = domHelper.createSlicerHeader(hostServices);
            containerDiv.appendChild(header);
            this.header = d3.select(header);

            this.body = container.append('div').classed(DropdownSlicerUtil.DropdownSelectors.Body.class, true)
                .style({
                    'height': PixelConverter.toString(bodyViewport.height),
                    'width': PixelConverter.toString(bodyViewport.width),
                });

            var rowEnter = (rowSelection: D3.Selection) => {
                this.onEnterSelection(rowSelection);
            };

            var rowUpdate = (rowSelection: D3.Selection) => {
                this.onUpdateSelection(rowSelection, interactivityService);
            };

            var rowExit = (rowSelection: D3.Selection) => {
                rowSelection.remove();
            };

            var dropdownViewOptions: DropdownViewOptions = {
                rowHeight: domHelper.getRowHeight(settings, this.textProperties),
                enter: rowEnter,
                exit: rowExit,
                update: rowUpdate,
                loadMoreData: () => slicerInitOptions.loadMoreData(),
                scrollEnabled: true,
                viewport: domHelper.getSlicerBodyViewport(this.currentViewport, settings, this.textProperties),
                baseContainer: this.body,
                isReadMode: () => {
                    return (this.hostServices.getViewMode() !== ViewMode.Edit);
                }
            };

            this.dropdownView = DropdownViewFactory.createDropdownView(dropdownViewOptions);
            $(this.dropdownView.scrollbarInner.node()).scrollbar();
           
            $(this.body.node()).find('.scroll-element').attr('drag-resize-disabled', 'true');
            this.element.get(0).appendChild(containerDiv);

            return interactivityService;
        }

        public render(options: DropdownSlicerRenderOptions): void {
            var data = this.data = options.data;
            this.currentViewport = options.viewport;
            var dataView = options.dataView;

            if (!dataView || !data) {
                this.dropdownView.empty();
                return;
            }

            this.dataView = dataView;
            var settings = this.settings = data.slicerSettings;
            var domHelper = this.domHelper;

            domHelper.updateSlicerBodyDimensions(this.currentViewport, this.body, settings);
            this.updateSelectionStyle();
            this.dropdownView
                .viewport(domHelper.getSlicerBodyViewport(this.currentViewport, settings, this.textProperties))
                .rowHeight(domHelper.getRowHeight(settings, this.textProperties))
                .data(
                data.slicerDataPoints,
                (d: DropdownSlicerDataPoint) => $.inArray(d, data.slicerDataPoints),
                options.resetScrollbarPosition
                );
        }

        private updateSelectionStyle(): void {
            var settings = this.settings;
            this.container.classed('isMultiSelectEnabled', settings && settings.dropdown && !settings.dropdown.singleSelect);
        }

        private onEnterSelection(rowSelection: D3.Selection): void {
            var settings = this.settings;
            var listItemElement = rowSelection.append('li')
                .classed(Selectors.ItemContainer.class, true);

            var labelElement = listItemElement.append('div')
                .classed(Selectors.Input.class, true);

            labelElement.append('input')
                .attr('type', 'checkbox');

            labelElement.append('span')
                .classed(Selectors.Checkbox.class, true);

            listItemElement.each(function (d: SlicerDataPoint, i: number) {
                var item = d3.select(this);
                if (d.isImage) {
                    item.append('img')
                        .classed(DropdownSlicerUtil.DropdownSelectors.LabelImage.class, true);
                }
                else {
                    item.append('span')
                        .classed(DropdownSlicerUtil.DropdownSelectors.LabelText.class, true);
                }

                if (d.count != null) {
                    item.append('span')
                        .classed(DropdownSlicerUtil.DropdownSelectors.CountText.class, true)
                        .style('font-size', PixelConverter.fromPoint(settings.dropdown.textSize));
                }
            });
        }

        private onUpdateSelection(rowSelection: D3.Selection, interactivityService: IInteractivityService): void {
            var settings = this.settings;
            var data = this.data;
            if (data && settings) {
                var domHelper = this.domHelper;
                domHelper.styleSlicerHeader(this.header, settings, data.categorySourceName);
                this.header.attr('title', data.categorySourceName);

                var labelText = rowSelection.selectAll(SlicerUtil.Selectors.LabelText.selector);
                labelText.text((d: DropdownSlicerDataPoint) => {
                    return d.value;
                }).attr('title', (d: DropdownSlicerDataPoint) => {
                    return d.tooltip;
                });
                domHelper.setSlicerTextStyle(labelText, settings);

                var labelImage = rowSelection.selectAll(SlicerUtil.Selectors.LabelImage.selector);
                if (!labelImage.empty()) {
                    labelImage.attr('src', (d: DropdownSlicerDataPoint) => {
                        return d.value;
                    });
                }

                this.dropdownView.slicerA.style({
                    'color': settings.dropdown.color,
                    'background-color': settings.dropdown.background,
                    'font-size': PixelConverter.fromPoint(settings.dropdown.textSize),
                });

                this.dropdownView.slicerDD.style({
                    'background-color': settings.dropdown.background,
                });
                var countText = rowSelection.selectAll(DropdownSlicerUtil.DropdownSelectors.CountText.selector);
                if (!countText.empty()) {
                    countText.text((d: SlicerDataPoint) => d.count);
                    domHelper.setSlicerTextStyle(countText, settings);
                }
                if (interactivityService && this.body) {
                    var body = this.body.attr('width', this.currentViewport.width);
                    var slicerItemContainers = body.selectAll(Selectors.ItemContainer.selector);
                    var slicerItemLabels = body.selectAll(DropdownSlicerUtil.DropdownSelectors.LabelText.selector);
                    var slicerItemInputs = body.selectAll(Selectors.Input.selector);
                    var slicerClear = this.header.select(DropdownSlicerUtil.DropdownSelectors.Clear.selector);
                    var searchInput = this.header.select('input');
                    var behaviorOptions: DropdownSlicerBehaviorOptions = {
                        dataPoints: data.slicerDataPoints,
                        slicerContainer: this.container,
                        itemContainers: slicerItemContainers,
                        itemLabels: slicerItemLabels,
                        itemInputs: slicerItemInputs,
                        clear: slicerClear,
                        interactivityService: interactivityService,
                        settings: data.slicerSettings,
                        searchInput: searchInput,
                        slicerA: this.dropdownView.slicerA,
                        slicerDD: this.dropdownView.slicerDD,
                        hasSelection: data.hasSelectionOverride
                    };
                    interactivityService.bind(
                        data.slicerDataPoints,
                        this.behavior,
                        behaviorOptions,
                        { overrideSelectionFromData: true, hasSelectionOverride: data.hasSelectionOverride, slicerDefaultValueHandler: this });
                    DropdownSlicerWebBehavior.styleSlicerItems(rowSelection.select(Selectors.Input.selector), data.hasSelectionOverride, interactivityService.isSelectionModeInverted());
                }
                else {
                    DropdownSlicerWebBehavior.styleSlicerItems(rowSelection.select(Selectors.Input.selector), false, false);
                }
            }
        }
    }

    export class DropdownSlicer implements IVisual {
        private element: JQuery;
        private currentViewport: IViewport;
        private dataView: DataView;
        private slicerData: DropdownSlicerData;
        private settings: DropdownSlicerSettings;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;
        private slicerRenderer: IDropdownSlicerRenderer;
        private waitingForData: boolean;
        private domHelper: DOMHelper;
        private initOptions: VisualInitOptions;
      
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Values',
                    kind: VisualDataRoleKind.Grouping,
                    displayName: powerbi.data.createDisplayNameGetter('Role_DisplayName_Field'),
                    description: data.createDisplayNameGetter('Role_DisplayName_FieldDescription')
                }
            ],
            objects: {
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        filter: {
                            type: { filter: {} },
                        },
                        selfFilter: {
                            type: { filter: { selfFilter: true } },
                        },
                        defaultValue: {
                            type: { expression: { defaultValue: true } },
                        },
                        formatString: StandardObjectProperties.formatString,
                        outlineColor: StandardObjectProperties.outlineColor,
                        outlineWeight: StandardObjectProperties.outlineWeight,
                        count: {
                            type: { integer: true }
                        },
                        selfFilterEnabled: {
                            type: { operations: { searchEnabled: true } }
                        },
                    },
                },
                dropdown: {
                    displayName: "Dropdown",
                    properties: {
                        selectAllCheckboxEnabled: {
                            displayName: data.createDisplayNameGetter('Visual_SelectAll'),
                            type: { bool: true }
                        },
                        singleSelect: {
                            displayName: data.createDisplayNameGetter('Visual_SingleSelect'),
                            type: { bool: true }
                        },
                        fontColor: StandardObjectProperties.fontColor,
                        background: {
                            displayName: data.createDisplayNameGetter('Visual_Background'),
                            type: { fill: { solid: { color: true } } }
                        },
                        textSize: {
                            displayName: data.createDisplayNameGetter('Visual_TextSize'),
                            type: { numeric: true }
                        },
                    }
                },
                //selection: {
                //    displayName: data.createDisplayNameGetter('Visual_SelectionControls'),
                //    properties: {
                //        selectAllCheckboxEnabled: {
                //            displayName: data.createDisplayNameGetter('Visual_SelectAll'),
                //            type: { bool: true }
                //        },
                //        singleSelect: {
                //            displayName: data.createDisplayNameGetter('Visual_SingleSelect'),
                //            type: { bool: true }
                //        }
                //    },
                //},
                header: {
                    displayName: data.createDisplayNameGetter('Visual_Header'),
                    properties: {
                        show: StandardObjectProperties.show,
                        fontColor: StandardObjectProperties.fontColor,
                        background: {
                            displayName: data.createDisplayNameGetter('Visual_Background'),
                            type: { fill: { solid: { color: true } } }
                        },
                        outline: StandardObjectProperties.outline,
                        textSize: {
                            displayName: data.createDisplayNameGetter('Visual_TextSize'),
                            type: { numeric: true }
                        },
                    }
                }
                //items: {
                //    displayName: data.createDisplayNameGetter('Role_DisplayName_Items'),
                //    properties: {
                //        fontColor: StandardObjectProperties.fontColor,
                //        background: {
                //            displayName: data.createDisplayNameGetter('Visual_Background'),
                //            type: { fill: { solid: { color: true } } }
                //        },
                //        outline: StandardObjectProperties.outline,
                //        textSize: {
                //            displayName: data.createDisplayNameGetter('Visual_TextSize'),
                //            type: { numeric: true }
                //        },
                //    }
                //}
            },
            dataViewMappings: [{
                conditions: [{ 'Values': { max: 1 } }],
                categorical: {
                    categories: {
                        for: { in: 'Values' },
                        dataReductionAlgorithm: { window: {} }
                    },
                    includeEmptyGroups: true,
                }
            }],

            sorting: {
                default: {},
            },
            suppressDefaultTitle: true,
            disableVisualDetails: true,
        };
        public static DefaultStyleProperties(): DropdownSlicerSettings {
            return {
                general: {
                    outlineColor: '#808080',
                    outlineWeight: 1
                },
                header: {
                    borderBottomWidth: 1,
                    show: true,
                    outline: visuals.outline.bottomOnly,
                    fontColor: '#000000',
                    textSize: 14,
                },
                dropdown: {
                    color: '#333',
                    textSize: 14,
                    selectAllCheckboxEnabled: false,
                    singleSelect: true,
                    background: '#efefef'
                },
                search: {
                    enabled: false,
                },
            };
        }

        constructor(options?: DropdownSlicerConstructorOptions) {
            if (options) {
                if (options.behavior) {
                    this.behavior = options.behavior;
                }
            }
            if (!this.behavior) {
                this.behavior = new DropdownSlicerWebBehavior();
            }
            this.domHelper = new DOMHelper();
        }

        public init(options: VisualInitOptions): void {
            this.initOptions = options;
            this.element = options.element;
            this.currentViewport = options.viewport;
            this.hostServices = options.host;
            var settings = this.settings = DropdownSlicer.DefaultStyleProperties();
     
            this.waitingForData = false;

            this.initializeSlicerRenderer();
        }

        public update(options: VisualUpdateOptions): void {

            var dataViews = options.dataViews;

            if (_.isEmpty(dataViews)) {
                return;
            }

            var existingDataView = this.dataView;
            this.dataView = dataViews[0];

        
            var resetScrollbarPosition = options.operationKind !== VisualDataChangeOperationKind.Append
                && !DataViewAnalysis.hasSameCategoryIdentity(existingDataView, this.dataView);

            this.render(resetScrollbarPosition, true);
        }

        public onResizing(finalViewport: IViewport): void {
            this.currentViewport = finalViewport;
            this.render(false /* resetScrollbarPosition */);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            return DropdownObjectEnumerator.enumerateObjectInstances(options, this.slicerData, this.settings, this.dataView);
        }

        public loadMoreData(): void {
            var dataView = this.dataView;
            if (!dataView)
                return;

            var dataViewMetadata = dataView.metadata;
            if (!this.waitingForData && dataViewMetadata && dataViewMetadata.segment) {
                this.hostServices.loadMoreData();
                this.waitingForData = true;
            }
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
                this.render(false /* resetScrollbarPosition */);
            }
        }

        private render(resetScrollbarPosition: boolean, stopWaitingForData?: boolean): void {
            var localizedSelectAllText = this.hostServices.getLocalizedString(DisplayNameKeys.SelectAll);
            this.slicerData = DropdownSlicerDataConversion.convert(this.dataView, localizedSelectAllText, this.interactivityService, this.hostServices);
            if (this.slicerData) {
                this.slicerData.slicerSettings.general.outlineWeight = Math.max(this.slicerData.slicerSettings.general.outlineWeight, 0);
                this.settings = this.slicerData.slicerSettings;
            }
            this.slicerRenderer.render({ dataView: this.dataView, data: this.slicerData, viewport: this.currentViewport, resetScrollbarPosition: resetScrollbarPosition });

            if (stopWaitingForData)
                this.waitingForData = false;
        }

        private initializeSlicerRenderer(): void {
            this.slicerRenderer = new DropdownSlicerRenderer({ domHelper: this.domHelper, behavior: this.behavior });
            var options = this.createInitOptions();
            this.interactivityService = this.slicerRenderer.init(options);
        }

        private createInitOptions(): DropdownSlicerInitOptions {
            return {
                visualInitOptions: this.initOptions,
                loadMoreData: () => this.loadMoreData()
            };
        }
    }

    module DropdownObjectEnumerator {
        export function enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions, data: DropdownSlicerData, settings: DropdownSlicerSettings, dataView: DataView): VisualObjectInstance[] {
            if (!data)
                return;

            switch (options.objectName) {
                case 'header':
                    return enumerateHeader(data, settings);
                case 'general':
                    return enumerateGeneral(data, settings);
                case 'dropdown':
                    if (shouldShowSelectionOption(dataView))
                        return enumerateDropdown(data, settings);
            }
        }

        function shouldShowSelectionOption(dataView: DataView): boolean {
            return !(dataView &&
                dataView.metadata &&
                dataView.metadata.columns &&
                _.some(dataView.metadata.columns, (column) => column.discourageAggregationAcrossGroups));
        }

        function enumerateDropdown(data: DropdownSlicerData, settings: DropdownSlicerSettings): VisualObjectInstance[] {
            var slicerSettings = settings;
            var areSelectionSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.dropdown;
            var selectAllCheckboxEnabled = areSelectionSettingsDefined && data.slicerSettings.dropdown.selectAllCheckboxEnabled ?
                data.slicerSettings.dropdown.selectAllCheckboxEnabled : slicerSettings.dropdown.selectAllCheckboxEnabled;
            var singleSelect = data && data.slicerSettings && data.slicerSettings.dropdown && data.slicerSettings.dropdown.singleSelect !== undefined ?
                data.slicerSettings.dropdown.singleSelect : slicerSettings.dropdown.singleSelect;

            var areTextSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.dropdown;
            var fontColor = areTextSettingsDefined && data.slicerSettings.dropdown.color ?
                data.slicerSettings.dropdown.color : slicerSettings.dropdown.color;
            var background = areTextSettingsDefined && data.slicerSettings.dropdown.background ?
                data.slicerSettings.dropdown.background : slicerSettings.dropdown.background;

            return [{
                selector: null,
                objectName: 'dropdown',
                properties: {
                    selectAllCheckboxEnabled: selectAllCheckboxEnabled,
                    singleSelect: singleSelect,
                    fontColor: fontColor,
                    background: background,
                    textSize: slicerSettings.dropdown.textSize,
                }
            }];
        }

        function enumerateHeader(data: DropdownSlicerData, settings: DropdownSlicerSettings): VisualObjectInstance[] {
            var slicerSettings = settings;
            var areHeaderSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.header;
            var fontColor = areHeaderSettingsDefined && data.slicerSettings.header.fontColor ?
                data.slicerSettings.header.fontColor : slicerSettings.header.fontColor;
            var background = areHeaderSettingsDefined && data.slicerSettings.header.background ?
                data.slicerSettings.header.background : slicerSettings.header.background;
            return [{
                selector: null,
                objectName: 'header',
                properties: {
                    show: slicerSettings.header.show,
                    fontColor: fontColor,
                    background: background,
                    outline: slicerSettings.header.outline,
                    textSize: slicerSettings.header.textSize,
                }
            }];
        }

        function enumerateGeneral(data: DropdownSlicerData, settings: DropdownSlicerSettings): VisualObjectInstance[] {
            var slicerSettings = settings;
            var areGeneralSettingsDefined = SettingsHelper.areSettingsDefined(data) && data.slicerSettings.general != null;
            var outlineColor = areGeneralSettingsDefined && data.slicerSettings.general.outlineColor ?
                data.slicerSettings.general.outlineColor : slicerSettings.general.outlineColor;
            var outlineWeight = areGeneralSettingsDefined && data.slicerSettings.general.outlineWeight ?
                data.slicerSettings.general.outlineWeight : slicerSettings.general.outlineWeight;
            
            return [{
                selector: null,
                objectName: 'general',
                properties: {
                    outlineColor: outlineColor,
                    outlineWeight: outlineWeight,
                }
            }];
        }
    }

    module Selectors {
        import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

        export var Container = createClassAndSelector('slicerContainer');
        export var ItemContainer = createClassAndSelector('slicerItemContainer');
        export var Input = createClassAndSelector('slicerCheckbox');
        export var Checkbox = createClassAndSelector('checkbox');
    }

    module CheckboxSprite {
        export var MinimumSize = 8;
        export var Size = 13;
        export var SizeRange = Size - MinimumSize;
    }

}

