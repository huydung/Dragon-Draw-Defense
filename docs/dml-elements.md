# Dragon Mania Legends Basic Elements

Reference list used by the prototype config and sandbox.

| Element | Prototype Glyph | Drawing Order |
| --- | --- | --- |
| Fire | Triangle / crest | bottom-left -> top -> bottom-right -> close |
| Wind | Sharp V | top-left -> bottom-center -> top-right |
| Earth | Horizontal line | left -> right |
| Water | Wave | left -> crest -> center -> trough -> right |
| Plant | Sprout | base -> top -> left leaf -> right leaf |
| Metal | Anvil plate | top-left -> top-right -> inner notch -> bottom-right -> bottom-left -> inner notch -> close |
| Energy | Lightning bolt | top -> mid-left -> mid-right -> bottom-left |
| Void | Squared hook | top-right -> top-left -> lower-left -> lower-right |
| Light | Circle | top -> upper-right -> lower-right -> bottom -> lower-left -> upper-left -> close |
| Shadow | Crescent arc | upper-right -> mid-left -> lower-left -> lower-right |
| Prism | Diamond | top -> right -> bottom -> left |

The prototype currently uses single-stroke glyphs so drawing order matters. The sandbox shows the expected path order by rendering the selected template with a start marker, numbered anchor points, and an end arrow. Templates are capped at seven anchors, which gives six stroke segments for distinctive shapes without letting templates become noisy sampled paths.
