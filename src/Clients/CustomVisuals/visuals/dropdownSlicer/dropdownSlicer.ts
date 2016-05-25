module powerbi.visuals.samples {

    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;
    import PixelConverter = jsCommon.PixelConverter;

    export interface IDropdownView {
        data(data: any[], dataIdFunction: (d) => {}, dataAppended: boolean): IDropdownView;
        rowHeight(rowHeight: number): IDropdownView;
        viewport(viewport: IViewport): IDropdownView;
        rows(rows: number): IDropdownView;
        render(): void;
        empty(): void;
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
        rows: number;
        rowHeight: number;
        viewport: IViewport;
        scrollEnabled: boolean;
    }
   
    export class DropdownView implements IDropdownView {
        private getDatumIndex: (d: any) => {};
        private _data: any[];
        private _totalRows: number;

        private options: DropdownViewOptions;
        private visibleGroupContainer: D3.Selection;
        private scrollContainer: D3.Selection;
        private dropdown: D3.Selection;
        private static defaultRowHeight = 1;

        public constructor(options: DropdownViewOptions) {
            // make a copy of options so that it is not modified later by caller
            this.options = $.extend(true, {}, options);
            this.options.baseContainer
                .style('overflow-y', 'auto')
                .attr('drag-resize-disabled', true);

            this.scrollContainer = options.baseContainer
                .append('div')
                .attr('class', 'scrollRegion');

            this.visibleGroupContainer = this.scrollContainer
                .append('div')
                .attr('class', 'visibleGroup');

            this.dropdown = this.visibleGroupContainer
                .append('select')
                .attr('class', 'select');

            DropdownView.SetDefaultOptions(options);
        }

        private static SetDefaultOptions(options: DropdownViewOptions) {
            options.rowHeight = options.rowHeight || DropdownView.defaultRowHeight;
        }

        public rowHeight(rowHeight: number): DropdownView {
            this.options.rowHeight = Math.ceil(rowHeight);
            return this;
        }

        public rows(rows: number): DropdownView {
            this.options.rows = Math.ceil(rows);
            return this;
        }

        public data(data: any[], getDatumIndex: (d) => {}, dataReset: boolean = false): DropdownView {
            this._data = data;
            this.getDatumIndex = getDatumIndex;
            this.setTotalRows();
            if (dataReset) {
                $(this.options.baseContainer.node()).scrollTop(0);
            }
            return this;
        }

        public viewport(viewport: IViewport): IDropdownView {
            this.options.viewport = viewport;
            return this;
        }

        public empty(): void {
            this._data = [];
            this.render();
        }


        private setTotalRows(): void {
            var count = this._data.length;
            var rows = Math.min(this.options.rows, count);
            this._totalRows = rows;
        }

        public render(): void {
            var options = this.options;
            var optionSelection = this.dropdown.selectAll(".row")
                .data(this._data);
           
            optionSelection
                .enter()
                .append("option")
                .classed('row', true)
                .call(d => options.enter(d));

            //optionSelection.order();
            var optionUpdateSelection = this.dropdown.selectAll('.row:not(.transitioning)');
            optionUpdateSelection.call(d => options.update(d));
            
            optionSelection
                .exit()
                .call(d => options.exit(d))
                .remove();
        }
    }

    export var dropdownslicerProps = {
        dropdown: {
            fontColor: <powerbi.DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'fontColor' },
            background: <powerbi.DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'background' },
            textSize: <powerbi.DataViewObjectPropertyIdentifier>{ objectName: 'dropdown', propertyName: 'textSize' },
        },
        selectedPropertyIdentifier: <powerbi.DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'selected' },
        filterPropertyIdentifier: <powerbi.DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'filter' },
        formatString: <powerbi.DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'formatString' },
        defaultValue: <powerbi.DataViewObjectPropertyIdentifier>{ objectName: 'general', propertyName: 'defaultValue' },
    };

    export interface DropdownSlicerConstructorOptions {
        behavior?: IInteractiveBehavior;
    }

    export interface DropdownSlicerData {
        categorySourceName: string;
        formatString: string;
        slicerDataPoints: DropdownSlicerDataPoint[];
        slicerSettings: DropdownSlicerSettings;
        hasSelectionOverride?: boolean;
    }

    export interface DropdownSlicerDataPoint extends SelectableDataPoint {
        category?: string;
        value?: number;
        isSelectAllDataPoint?: boolean;
        selectable?: boolean;
    }

    export interface DropdownSlicerSettings {
        general: {
            rows: number;
        };
        slicerText: {
            textSize: number;
            fontColor: string;
            background: string;
        };
        slicerItemContainer: {
            marginTop: number;
            marginLeft: number;
        };
    }

    export class DropdownSlicer implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: powerbi.VisualDataRoleKind.Grouping,
                    displayName: powerbi.data.createDisplayNameGetter('Role_DisplayName_Field'),
                },
                {
                    name: 'Values',
                    kind: powerbi.VisualDataRoleKind.Measure,
                    displayName: powerbi.data.createDisplayNameGetter('Role_DisplayName_Values'),
                }
            ],
            objects: {
                general: {
                    displayName: powerbi.data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        selected: {
                            type: { bool: true }
                        },
                        filter: {
                            type: { filter: {} },
                            rule: {
                                output: {
                                    property: 'selected',
                                    selector: ['Category'],
                                }
                            }
                        },
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                    },
                },
                dropdown: {
                    displayName: "Dropdown",
                    properties: {
                        fontColor: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_FontColor'),
                            type: { fill: { solid: { color: true } } }
                        },
                        background: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_Background'),
                            type: { fill: { solid: { color: true } } }
                        },
                        textSize: {
                            displayName: powerbi.data.createDisplayNameGetter('Visual_TextSize'),
                            type: { numeric: true }
                        },
                    }
                },
            },
            dataViewMappings: [{
                conditions: [
                    { 'Category': { max: 1 }, 'Values': { min: 0, max: 1 } }],
                categorical: {
                    categories: {
                        for: { in: 'Category' },
                        dataReductionAlgorithm: { top: {} }
                    },
                    values: {
                        group: {
                            by: 'Category',
                            select: [{ bind: { to: 'Values' } },
                            ],
                            dataReductionAlgorithm: { top: {} }
                        }
                    },
                    includeEmptyGroups: true
                }
            }],
            supportsHighlight: true,
            sorting: {
                default: {},
            },
            drilldown: {
                roles: ['Category']
            },
            suppressDefaultTitle: true,
        };
        private element: JQuery;
        private currentViewport: IViewport;
        private dataView: DataView;
        private slicerBody: D3.Selection;
        private dropdownView: IDropdownView;
        private slicerData: DropdownSlicerData;
        private settings: DropdownSlicerSettings;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private hostServices: IVisualHostServices;

        private waitingForData: boolean;
        private static ItemContainer: ClassAndSelector = createClassAndSelector('select');
        private static Container: ClassAndSelector = createClassAndSelector('dropdownSlicer');
        private static LabelText: ClassAndSelector = createClassAndSelector('slicerText');
        private static Header: ClassAndSelector = createClassAndSelector('slicerHeader');
        private static Input: ClassAndSelector = createClassAndSelector('slicerCheckbox');
        private static Clear: ClassAndSelector = createClassAndSelector('clear');
        private static Body: ClassAndSelector = createClassAndSelector('slicerBody');
        public static DefaultFontFamily: string = 'Segoe UI, Tahoma, Verdana, Geneva, sans-serif';
        public static DefaultFontSizeInPt: number = 11;
        public static DefaultStyleProperties(): DropdownSlicerSettings {
            return {
                general: {
                    rows: 1
                },
                slicerText: {
                    textSize: 12,
                    fontColor: '#666666',
                    background: '#ffffff'
                },
                slicerItemContainer: {
                    marginTop: 5,
                    marginLeft: 0,
                }
            };
        }
        private static isFirstLoad: boolean = false;

        constructor(options?: DropdownSlicerConstructorOptions) {
            if (options) {
                if (options.behavior) {
                    this.behavior = options.behavior;
                }
            }
            if (!this.behavior) {
                this.behavior = new DropdownSlicerWebBehavior();
            }
        }

        public static converter(dataView: DataView, localizedSelectAllText: string, interactivityService: IInteractivityService): DropdownSlicerData {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[0].values ||
                !(dataView.categorical.categories[0].values.length > 0)) {
                return;
            }
            var converter = new DropdownDataConversion.DropdownSlicerConverter(dataView, interactivityService);
            converter.convert();
            var slicerData: DropdownSlicerData;
            var defaultSettings: DropdownSlicerSettings = this.DefaultStyleProperties();
            var objects: DataViewObjects = dataView.metadata.objects;
            if (objects) {
                defaultSettings.slicerText.fontColor = powerbi.DataViewObjects.getFillColor(objects, dropdownslicerProps.dropdown.fontColor, defaultSettings.slicerText.fontColor);
                var textBackground = powerbi.DataViewObjects.getFillColor(objects, dropdownslicerProps.dropdown.background);
                if (textBackground)
                    defaultSettings.slicerText.background = textBackground;
                defaultSettings.slicerText.textSize = powerbi.DataViewObjects.getValue<number>(objects, dropdownslicerProps.dropdown.textSize, defaultSettings.slicerText.textSize);
            }

            var categories: DataViewCategoricalColumn = dataView.categorical.categories[0];
            slicerData = {
                categorySourceName: categories.source.displayName,
                formatString: powerbi.visuals.valueFormatter.getFormatString(categories.source, dropdownslicerProps.formatString),
                slicerSettings: defaultSettings,
                slicerDataPoints: converter.dataPoints,
            };

            slicerData.hasSelectionOverride = converter.hasSelectionOverride;

            return slicerData;
        }

        public init(options: VisualInitOptions): void {
            this.element = options.element;
            this.currentViewport = options.viewport;
            if (this.behavior) {
                this.interactivityService = powerbi.visuals.createInteractivityService(options.host);
            }
            this.hostServices = options.host;
            this.settings = DropdownSlicer.DefaultStyleProperties();

            this.initContainer();
           
        }

        public update(options: VisualUpdateOptions): void {
                      
            if (!options ||
                !options.dataViews ||
                !options.dataViews[0] ||
                !options.viewport) {
                return;
            }

            var existingDataView = this.dataView;
            this.dataView = options.dataViews[0];
            // Reset scrollbar by default, unless it's an Append operation or Selecting an item
            var resetScrollbarPosition: boolean = true;
            if (existingDataView) {
                resetScrollbarPosition = !powerbi.DataViewAnalysis.hasSameCategoryIdentity(existingDataView, this.dataView);
            }

            if (options.viewport.height === this.currentViewport.height
                && options.viewport.width === this.currentViewport.width) {
                this.waitingForData = false;
            }
            else {
                this.currentViewport = options.viewport;
            }
           
            this.updateInternal(resetScrollbarPosition);
           
        }

        public onResizing(finalViewport: IViewport): void {
            this.currentViewport = finalViewport;
            this.updateInternal(false /* resetScrollbarPosition */);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var data: DropdownSlicerData = this.slicerData;
            if (!data)
                return;

            var objectName = options.objectName;
            switch (objectName) {
                case 'dropdown':
                    return this.enumerateDropdown(data);
                case 'general':
                    return this.enumerateGeneral(data);
            }
        }

        private enumerateDropdown(data: DropdownSlicerData): VisualObjectInstance[] {
            var slicerSettings: DropdownSlicerSettings = this.settings;
            return [{
                selector: null,
                objectName: 'dropdown',
                properties: {
                    textSize: slicerSettings.slicerText.textSize,
                    background: slicerSettings.slicerText.background,
                    fontColor: slicerSettings.slicerText.fontColor,
                }
            }];
        }

        private enumerateGeneral(data: DropdownSlicerData): VisualObjectInstance[] {
            var slicerSettings: DropdownSlicerSettings = this.settings;

            return [{
                selector: null,
                objectName: 'general',
                properties: {
                    rows: slicerSettings.general.rows,
                }
            }];
        }

        private updateInternal(resetScrollbarPosition: boolean) {
            this.updateSlicerBodyDimensions();
            var localizedSelectAllText: string = 'Select All';
            var data = DropdownSlicer.converter(this.dataView, localizedSelectAllText, this.interactivityService);
            if (!data) {
                this.dropdownView.empty();
                return;
            }
            this.slicerData = data;
            this.settings = this.slicerData.slicerSettings;
            this.dropdownView
                .rowHeight(1)
                .rows(this.settings.general.rows)
                .data(data.slicerDataPoints,
                (d: DropdownSlicerDataPoint) => $.inArray(d, data.slicerDataPoints),
                resetScrollbarPosition)
                .viewport(this.getSlicerBodyViewport(this.currentViewport))
                .render();
        }

        private initContainer() {
            var settings: DropdownSlicerSettings = this.settings;
            var slicerBodyViewport: IViewport = this.getSlicerBodyViewport(this.currentViewport);
            var slicerContainer: D3.Selection = d3.select(this.element.get(0))
                .append('div')
                .classed(DropdownSlicer.Container.class, true);

            this.slicerBody = slicerContainer
                .append('div').classed(DropdownSlicer.Body.class, true)

                .style({
                    'height': PixelConverter.toString(slicerBodyViewport.height),
                    'width': '100%',
                });

            var rowEnter = (rowSelection: D3.Selection) => {
                if (rowSelection.length > 0 && rowSelection[0].length == 0) {
                    DropdownSlicer.isFirstLoad = true;
                }
            };

            var rowUpdate = (rowSelection: D3.Selection) => {
                var settings: DropdownSlicerSettings = this.settings;
                var data = this.slicerData;
                if (data && settings) {
                    var dropdown = d3.select(".select");
                    dropdown.style({
                        'font-size': settings.slicerText.textSize + "px",
                        'color': settings.slicerText.fontColor,
                        'background': settings.slicerText.background
                    });
                    var slicerText = rowSelection.text(d=> d.category);

                    if (this.interactivityService && this.slicerBody) {
                        var slicerBody = this.slicerBody.attr('width', this.currentViewport.width);
                        var slicerItemContainers = slicerBody.selectAll(DropdownSlicer.ItemContainer.selector);
                        var slicerItemLabels = slicerBody.selectAll(".row");
                        var slicerItemInputs = slicerBody.selectAll(DropdownSlicer.Input.selector);

                        var behaviorOptions: DropdownSlicerBehaviorOptions = {
                            dataPoints: data.slicerDataPoints,
                            slicerItemContainers: slicerItemContainers,
                            slicerItemLabels: slicerItemLabels,
                            slicerItemInputs: slicerItemInputs,
                            interactivityService: this.interactivityService,
                            slicerSettings: data.slicerSettings,
                        };

                        this.interactivityService.bind(data.slicerDataPoints, this.behavior, behaviorOptions, {
                            overrideSelectionFromData: true,
                            hasSelectionOverride: data.hasSelectionOverride
                        });
                    }

                    if (DropdownSlicer.isFirstLoad) {
                        DropdownSlicer.isFirstLoad = false;
                        var event = document.createEvent('Event');
                        event.initEvent('change', true, true);
                        dropdown.node().dispatchEvent(event);
                    }

                }
            };

            var rowExit = (rowSelection: D3.Selection) => {
                rowSelection.remove();
            };

            var dropdownViewOptions: DropdownViewOptions = {
                rowHeight: 1,
                rows: this.settings.general.rows,
                enter: rowEnter,
                exit: rowExit,
                update: rowUpdate,
                loadMoreData: () => this.onLoadMoreData(),
                scrollEnabled: true,
                viewport: this.getSlicerBodyViewport(this.currentViewport),
                baseContainer: this.slicerBody,
            };

            this.dropdownView = DropdownViewFactory.createDropdownView(dropdownViewOptions);
        }


        private onLoadMoreData(): void {
            if (!this.waitingForData && this.dataView.metadata && this.dataView.metadata.segment) {
                this.hostServices.loadMoreData();
                this.waitingForData = true;
            }
        }

        private getSlicerBodyViewport(currentViewport: IViewport): IViewport {
            var settings = this.settings;
            var slicerBodyHeight = currentViewport.height;
            return {
                height: slicerBodyHeight,
                width: currentViewport.width
            };
        }

        private updateSlicerBodyDimensions(): void {
            var slicerViewport: IViewport = this.getSlicerBodyViewport(this.currentViewport);
            this.slicerBody
                .style({
                    'height': PixelConverter.toString(slicerViewport.height),
                    'width': '100%',
                });
        }

        public static getTextProperties(textSize?: number): TextProperties {
            return <TextProperties>{
                fontFamily: DropdownSlicer.DefaultFontFamily,
                fontSize: PixelConverter.fromPoint(textSize || DropdownSlicer.DefaultFontSizeInPt),
            };
        }

    }

    module DropdownDataConversion {
        export class DropdownSlicerConverter {
            private dataViewCategorical: DataViewCategorical;
            private dataViewMetadata: DataViewMetadata;
            private category: DataViewCategoryColumn;
            private categoryIdentities: DataViewScopeIdentity[];
            private categoryValues: any[];
            private categoryColumnRef: powerbi.data.SQExpr[];
            private categoryFormatString: string;
            private interactivityService: IInteractivityService;

            public numberOfCategoriesSelectedInData: number;
            public dataPoints: DropdownSlicerDataPoint[];
            public hasSelectionOverride: boolean;

            public constructor(dataView: DataView, interactivityService: IInteractivityService) {

                var dataViewCategorical = dataView.categorical;
                this.dataViewCategorical = dataViewCategorical;
                this.dataViewMetadata = dataView.metadata;

                if (dataViewCategorical.categories && dataViewCategorical.categories.length > 0) {
                    this.category = dataViewCategorical.categories[0];
                    this.categoryIdentities = this.category.identity;
                    this.categoryValues = this.category.values;
                    this.categoryColumnRef = <powerbi.data.SQExpr[]>this.category.identityFields;
                    this.categoryFormatString = powerbi.visuals.valueFormatter.getFormatString(this.category.source, dropdownslicerProps.formatString);
                }

                this.dataPoints = [];

                this.interactivityService = interactivityService;
                this.hasSelectionOverride = false;
            }

            public convert(): void {
                this.dataPoints = [];
                this.numberOfCategoriesSelectedInData = 0;
                // If category exists, we render labels using category values. If not, we render labels
                // using measure labels.
                if (this.categoryValues) {
                    var objects = this.dataViewMetadata ? <any>this.dataViewMetadata.objects : undefined;

                    var isInvertedSelectionMode = undefined;
                    var numberOfScopeIds: number;
                    if (objects && objects.general && objects.general.filter) {
                        if (!this.categoryColumnRef)
                            return;
                        var filter = <powerbi.data.SemanticFilter>objects.general.filter;
                        var scopeIds = powerbi.data.SQExprConverter.asScopeIdsContainer(filter, this.categoryColumnRef);
                        if (scopeIds) {
                            isInvertedSelectionMode = scopeIds.isNot;
                            numberOfScopeIds = scopeIds.scopeIds ? scopeIds.scopeIds.length : 0;
                        }
                        else {
                            isInvertedSelectionMode = false;
                        }
                    }

                    if (this.interactivityService) {
                        if (isInvertedSelectionMode === undefined) {
                            // The selection state is read from the Interactivity service in case of SelectAll or Clear when query doesn't update the visual
                            isInvertedSelectionMode = this.interactivityService.isSelectionModeInverted();
                        }
                        else {
                            this.interactivityService.setSelectionModeInverted(isInvertedSelectionMode);
                        }
                    }

                    var hasSelection: boolean = undefined;

                    for (var idx = 0; idx < this.categoryValues.length; idx++) {
                        var selected = powerbi.visuals.isCategoryColumnSelected(dropdownslicerProps.selectedPropertyIdentifier, this.category, idx);
                        if (selected != null) {
                            hasSelection = selected;
                            break;
                        }
                    }

                    var dataViewCategorical = this.dataViewCategorical;
                    var formatStringProp = dropdownslicerProps.formatString;
                    var value: number = -Infinity;
                    var imageURL: string = '';

                    for (var categoryIndex: number = 0, categoryCount = this.categoryValues.length; categoryIndex < categoryCount; categoryIndex++) {
                        var categoryIdentity = this.category.identity ? this.category.identity[categoryIndex] : null;
                        var categoryIsSelected = powerbi.visuals.isCategoryColumnSelected(dropdownslicerProps.selectedPropertyIdentifier, this.category, categoryIndex);
                        var selectable: boolean = true;

                        if (hasSelection != null) {
                            if (isInvertedSelectionMode) {
                                if (this.category.objects == null)
                                    categoryIsSelected = undefined;

                                if (categoryIsSelected != null) {
                                    categoryIsSelected = hasSelection;
                                }
                                else if (categoryIsSelected == null)
                                    categoryIsSelected = !hasSelection;
                            }
                            else {
                                if (categoryIsSelected == null) {
                                    categoryIsSelected = !hasSelection;
                                }
                            }
                        }

                        if (categoryIsSelected) {
                            this.numberOfCategoriesSelectedInData++;
                        }

                        var categoryValue = this.categoryValues[categoryIndex];
                        var categoryLabel = powerbi.visuals.valueFormatter.format(categoryValue, this.categoryFormatString);

                        if (this.dataViewCategorical.values) {
                        
                            // Series are either measures in the multi-measure case, or the single series otherwise
                            for (var seriesIndex: number = 0; seriesIndex < this.dataViewCategorical.values.length; seriesIndex++) {
                                var seriesData = dataViewCategorical.values[seriesIndex];
                                if (seriesData.values[categoryIndex] != null) {
                                    value = seriesData.values[categoryIndex];
                                    if (seriesData.highlights) {
                                        selectable = !(seriesData.highlights[categoryIndex] === null);
                                    }
                                    
                                }
                            }
                        }
                        this.dataPoints.push({
                            identity: powerbi.visuals.SelectionId.createWithId(categoryIdentity),
                            category: categoryLabel,
                            value: value,
                            selected: categoryIsSelected,
                            selectable: selectable
                        });
                    }
                    if (numberOfScopeIds != null && numberOfScopeIds > this.numberOfCategoriesSelectedInData) {
                        this.hasSelectionOverride = true;
                    }
                }
            }
        }
    }

    export interface DropdownSlicerBehaviorOptions {
        slicerItemContainers: D3.Selection;
        slicerItemLabels: D3.Selection;
        slicerItemInputs: D3.Selection;
        dataPoints: DropdownSlicerDataPoint[];
        interactivityService: IInteractivityService;
        slicerSettings: DropdownSlicerSettings;
    }

    export class DropdownSlicerWebBehavior implements IInteractiveBehavior {
        private slicers: D3.Selection;
        private slicerItemLabels: D3.Selection;
        private slicerItemInputs: D3.Selection;
        private dataPoints: DropdownSlicerDataPoint[];
        private interactivityService: IInteractivityService;
        private slicerSettings: DropdownSlicerSettings;

        public bindEvents(options: DropdownSlicerBehaviorOptions, selectionHandler: ISelectionHandler): void {
            var filterPropertyId = dropdownslicerProps.filterPropertyIdentifier;
            var slicers = this.slicers = options.slicerItemContainers;
            this.slicerItemLabels = options.slicerItemLabels;

            this.dataPoints = options.dataPoints;
            this.interactivityService = options.interactivityService;
            this.slicerSettings = options.slicerSettings;
            slicers.on("change", (data, index) => {
                var x: any = slicers.property("value");
                d3.event.preventDefault();
                if (x === "Select All") {
                    selectionHandler.handleClearSelection();
                    selectionHandler.persistSelectionFilter(filterPropertyId);
                }
                else {
                    var elementPos = this.dataPoints.map(function (x) { return x.category; }).indexOf(x);
                    var d = this.dataPoints[elementPos];

                    if (!d.selectable) {
                        return;
                    }

                    selectionHandler.handleSelection(d, false /* isMultiSelect */);
                    selectionHandler.persistSelectionFilter(filterPropertyId);
                }
            });

        }

        public renderSelection(hasSelection: boolean): void {

        }
    }
}

