# Test MRs for Unity Asset Viewer

We will use the following Merge Requests / Pull Requests from popular open-source Unity projects to test our extension's rendering capabilities.

## 1. Mixed Reality Toolkit (MRTK)
The MRTK repository contains highly complex UI prefabs (Canvas, RectTransform, LayoutGroups) used for spatial computing interfaces.
- **Repository:** [microsoft/MixedRealityToolkit-Unity](https://github.com/microsoft/MixedRealityToolkit-Unity)
- **PRs to test:** [MRTK Pull Requests involving "Prefab" and "UI"](https://github.com/microsoft/MixedRealityToolkit-Unity/pulls?q=is%3Apr+prefab+UI)

## 2. Unity UI (UGUI) Core
The official Unity UI repository is the perfect place to test fundamental UI rendering. It contains many sample prefabs demonstrating raw `RectTransform` layouts.
- **Repository:** [Unity-Technologies/UI](https://github.com/Unity-Technologies/UI)
- **PRs to test:** [Unity UI Pull Requests](https://github.com/Unity-Technologies/UI/pulls?q=is%3Apr+prefab)

## 3. General GitHub Search
If we need a wider variety of test cases from different developers:
- **Search Link:** [GitHub PRs: "prefab" "Canvas" "RectTransform"](https://github.com/search?q=%22prefab%22+%22Canvas%22+%22RectTransform%22+is%3Apr&type=pullrequests)
