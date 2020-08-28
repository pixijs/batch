import { BatchGeometry } from 'pixi-batch-renderer';
import { DiffBuffer } from './DiffBuffer';

import type { AttributeRedirect } from 'pixi-batch-renderer';

/**
 * The geometry used by {@link DiffGeometryFactory}
 */
export class DiffGeometry extends BatchGeometry
{
    constructor(attributeRedirects: AttributeRedirect[],
        hasIndex: boolean,
        texIDAttrib: string,
        texturesPerObject: number,
        inBatchIDAttrib: string,
        uniformIDAttrib: string,
        masterIDAttrib: string)
    {
        super(attributeRedirects,
            hasIndex,
            texIDAttrib,
            texturesPerObject,
            inBatchIDAttrib,
            uniformIDAttrib,
            masterIDAttrib,
            new DiffBuffer(null, false, false),
            new DiffBuffer(null, false, true));
    }
}
