import { encodeTemporal } from './url/temporalEncoders'
import { categoryNameToCMRParam } from './facets'

/**
 * Prepare parameters used in getCollections() based on current Redux State
 * @param {object} state Current Redux State
 * @returns Parameters used in buildSearchParams
 */
export const prepareCollectionParams = (state) => {
  const {
    authToken,
    facetsParams,
    query,
    searchResults
  } = state

  const { collection: collectionQuery } = query

  const {
    keyword,
    pageNum,
    spatial = {},
    temporal = {}
  } = collectionQuery

  const {
    boundingBox,
    point,
    polygon
  } = spatial

  const { selectedCategory: viewAllFacetsCategory } = searchResults.viewAllFacets

  const temporalString = encodeTemporal(temporal)

  const {
    cmr: cmrFacets = {},
    feature: featureFacets = {},
    viewAll: viewAllFacets = {}
  } = facetsParams

  const tagKey = []
  if (featureFacets.customizable) tagKey.push('edsc.extra.subset_service.*')
  if (featureFacets.mapImagery) tagKey.push('edsc.extra.serverless.gibs')

  return {
    authToken,
    boundingBox,
    cmrFacets,
    featureFacets,
    keyword,
    pageNum,
    point,
    polygon,
    tagKey,
    temporalString,
    viewAllFacetsCategory,
    viewAllFacets
  }
}

/**
 * Translates the values returned from prepareCollectionParams to the camelCased keys that are expected in
 * the collections.search() function
 * @param {object} params - Params to be passed to the collections.search() function.
 * @param {object} options - Optional options object
 * @param {boolean} options.viewAllFacetsRequest - Optional options object
 * @returns Parameters to be provided to the Collections request with camel cased keys
 */
export const buildSearchParams = (params) => {
  const {
    boundingBox,
    cmrFacets,
    featureFacets,
    keyword,
    pageNum,
    point,
    polygon,
    tagKey,
    temporalString,
    viewAllFacetsCategory,
    viewAllFacets
  } = params

  let facetsToSend = { ...cmrFacets }

  // If viewAllFacets has any keys, we know that the view all facets modal is active and we want to
  // detirmine the next results based on those facets.
  if (Object.keys(viewAllFacets).length) {
    facetsToSend = { ...viewAllFacets }
  }

  // Set up params that are not driven by the URL
  const defaultParams = {
    hasGranulesOrCwic: true,
    includeFacets: 'v2',
    includeGranuleCounts: true,
    includeHasGranules: true,
    includeTags: 'edsc.*,org.ceos.wgiss.cwic.granules.prod',
    options: {
      science_keywords_h: {
        or: true
      },
      temporal: {
        limit_to_granules: true
      }
    },
    pageSize: 20,
    sortKey: ['has_granules_or_cwic']
  }

  return {
    ...defaultParams,
    boundingBox,
    collectionDataType: featureFacets.nearRealTime ? ['NEAR_REAL_TIME'] : undefined,
    dataCenterH: facetsToSend.data_center_h,
    instrumentH: facetsToSend.instrument_h,
    keyword,
    pageNum,
    platformH: facetsToSend.platform_h,
    point,
    polygon,
    processingLevelIdH: facetsToSend.processing_level_id_h,
    projectH: facetsToSend.project_h,
    scienceKeywordsH: facetsToSend.science_keywords_h,
    tagKey,
    temporal: temporalString,
    facetsSize: viewAllFacetsCategory
      ? { [categoryNameToCMRParam(viewAllFacetsCategory)]: 10000 }
      : undefined
  }
}
